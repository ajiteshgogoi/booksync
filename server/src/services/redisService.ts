import { Redis } from 'ioredis';
import type { Redis as RedisType } from 'ioredis';
import { logger } from '../utils/logger.js';

// Connection pool configuration - optimized for Redis Cloud free tier (30 max connections)
const POOL_SIZE = process.env.VERCEL ? 3 : 5; // More conservative pool size
const POOL_ACQUIRE_TIMEOUT = process.env.VERCEL ? 5000 : 10000; // Increased timeouts
const MAX_RETRIES = process.env.VERCEL ? 3 : 5; // Increased retries
const RETRY_DELAY = 500; // Initial retry delay
const RETRY_BACKOFF = 1.5; // Exponential backoff multiplier

const CONNECTION_TIMEOUT = 15000; // Connection timeout
const CONNECTION_MAX_AGE = 180000; // 3 minutes max age
const CONNECTION_IDLE_TIMEOUT = 20000; // 20 seconds idle timeout
const REAPER_INTERVAL = 10000; // 10 seconds reaper interval
const MAX_CONNECTION_WAITERS = 5; // Conservative number of waiters

interface PoolConnection {
  client: RedisType;
  inUse: boolean;
  lastUsed: number;
  acquiredAt: number | null;
  createdAt: number;
  id: string;
}

interface ConnectionStats {
  totalAcquires: number;
  totalReleases: number;
  totalTimeouts: number;
  totalErrors: number;
  maxWaiters: number;
  totalStaleConnections: number;
  totalReconnects: number;
  lastError: Error | null;
  lastErrorTimestamp: number;
  lastAcquireDuration: number;
}

class RedisPool {
  private pool: PoolConnection[] = [];
  private connectionWaiters: number = 0;
  private connectionStats: ConnectionStats = {
    totalAcquires: 0,
    totalReleases: 0,
    totalTimeouts: 0,
    totalErrors: 0,
    maxWaiters: 0,
    totalStaleConnections: 0,
    totalReconnects: 0,
    lastError: null,
    lastErrorTimestamp: 0,
    lastAcquireDuration: 0
  };

  private static instance: RedisPool | null = null;

  public static getInstance(): RedisPool {
    if (!RedisPool.instance) {
      RedisPool.instance = new RedisPool();
    }
    return RedisPool.instance;
  }

  constructor() {
    this.startConnectionReaper();
  }

  private async createClient(): Promise<RedisType> {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing Redis URL configuration');
    }

    const options = {
      maxRetriesPerRequest: 2,
      connectTimeout: 8000,
      retryStrategy(times: number) {
        if (times > MAX_RETRIES) {
          return null;
        }
        const delay = Math.min(times * RETRY_DELAY, 5000);
        return delay;
      },
      reconnectOnError(err: Error) {
        const targetErrors = ['READONLY', 'ERR max number of clients reached'];
        return targetErrors.some(e => err.message.includes(e));
      },
      enableOfflineQueue: true,
      enableReadyCheck: true,
      commandTimeout: 8000
    };

    const redis = new Redis(process.env.REDIS_URL, options);
    await redis.ping();
    return redis;
  }

  private async initializePool(): Promise<void> {
    for (let i = 0; i < POOL_SIZE; i++) {
      const client = await this.createClient();
      const now = Date.now();
      this.pool.push({
        client,
        inUse: false,
        lastUsed: now,
        acquiredAt: null,
        createdAt: now,
        id: `conn-${now}-${i}`
      });
    }
  }

  private startConnectionReaper(): void {
    setInterval(async () => {
      for (const connection of this.pool) {
        try {
          const isStale = await this.isConnectionStale(connection);
          if (isStale) {
            await this.replaceConnection(connection);
          }
        } catch (error) {
          logger.error('Error in connection reaper', { error });
        }
      }
    }, REAPER_INTERVAL);
  }

  private async isConnectionStale(connection: PoolConnection): Promise<boolean> {
    const now = Date.now();

    if (now - connection.createdAt > CONNECTION_MAX_AGE) {
      return true;
    }

    if (!connection.inUse && now - connection.lastUsed > CONNECTION_IDLE_TIMEOUT) {
      return true;
    }

    if (connection.inUse && connection.acquiredAt && 
        now - connection.acquiredAt > CONNECTION_TIMEOUT) {
      return true;
    }

    try {
      await connection.client.ping();
      return false;
    } catch {
      return true;
    }
  }

  private async replaceConnection(connection: PoolConnection): Promise<void> {
    try {
      await connection.client.quit();
      this.connectionStats.totalStaleConnections++;
      
      const index = this.pool.indexOf(connection);
      if (index !== -1) {
        const newClient = await this.createClient();
        this.pool[index] = {
          client: newClient,
          inUse: false,
          lastUsed: Date.now(),
          acquiredAt: null,
          createdAt: Date.now(),
          id: `conn-${Date.now()}-${index}`
        };
        this.connectionStats.totalReconnects++;
      }
    } catch (error) {
      logger.error('Error replacing connection', { error });
      this.connectionStats.totalErrors++;
    }
  }

  public async acquire(): Promise<RedisType> {
    if (this.connectionWaiters >= MAX_CONNECTION_WAITERS) {
      this.connectionStats.totalErrors++;
      throw new Error('Maximum number of connection waiters reached');
    }

    this.connectionWaiters++;
    this.connectionStats.maxWaiters = Math.max(
      this.connectionStats.maxWaiters,
      this.connectionWaiters
    );

    let currentRetry = 0;
    let currentDelay = RETRY_DELAY;

    try {
      if (this.pool.length === 0) {
        await this.initializePool();
      }

      while (currentRetry < MAX_RETRIES) {
        const connection = this.pool.find(conn => !conn.inUse);
        
        if (connection && !await this.isConnectionStale(connection)) {
          connection.inUse = true;
          connection.lastUsed = Date.now();
          connection.acquiredAt = Date.now();
          this.connectionWaiters--;
          return connection.client;
        }

        currentRetry++;
        if (currentRetry < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay = Math.min(currentDelay * RETRY_BACKOFF, POOL_ACQUIRE_TIMEOUT);
        }
      }

      this.connectionWaiters--;
      throw new Error('Failed to acquire Redis connection after maximum retries');
    } catch (error) {
      this.connectionWaiters--;
      throw error;
    }
  }

  public release(client: RedisType): void {
    const connection = this.pool.find(conn => conn.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
      connection.acquiredAt = null;
    }
  }

  public async cleanup(): Promise<void> {
    for (const connection of this.pool) {
      try {
        await connection.client.quit();
      } catch (error) {
        logger.error('Error during cleanup', { error });
      }
    }
    this.pool = [];
  }
}

// Stream configuration
export const STREAM_NAME = 'sync_jobs_stream';
export const CONSUMER_GROUP = 'sync_processors';
export const CONSUMER_NAME = `consumer-${process.pid}`;
export const JOB_TTL = 60 * 60 * 24; // 24 hours

// Create Redis pool instance
const redisPool = RedisPool.getInstance();

// Job status types
export type JobStatus = {
  state: 'pending' | 'processing' | 'completed' | 'failed' | 'queued';
  progress?: number;
  message?: string;
  result?: any;
  total?: number;
  lastCheckpoint?: number;
  completedAt?: number;
  lastProcessedIndex?: number;
};

// Initialize stream and consumer group
export async function initializeStream(): Promise<void> {
  const redis = await getRedis();
  try {
    await redis.xgroup('CREATE', STREAM_NAME, CONSUMER_GROUP, '0', 'MKSTREAM');
  } catch (err: any) {
    if (!err.message.includes('BUSYGROUP')) {
      throw err;
    }
  }
}

// Get Redis client
export async function getRedis(): Promise<RedisType> {
  return await redisPool.acquire();
}

// Add job to queue
export async function addJobToQueue(jobId: string): Promise<void> {
  const redis = await getRedis();
  try {
    await redis.xadd(STREAM_NAME, '*', 'jobId', jobId);
    await setJobStatus(jobId, { state: 'pending' });
  } finally {
    redisPool.release(redis);
  }
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX = 10; // Max requests per window

// Rate limiting
export async function checkRateLimit(databaseId: string): Promise<boolean> {
  const redis = await getRedis();
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const key = `rate_limit:${databaseId}:${currentTime}`;
    
    const requests = await redis.incr(key);
    if (requests === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    
    return requests <= RATE_LIMIT_MAX;
  } finally {
    redisPool.release(redis);
  }
}

// Get next job
export async function getNextJob(): Promise<{ jobId: string; messageId: string } | null> {
  const redis = await getRedis();
  try {
    const results = await redis.xreadgroup(
      'GROUP', CONSUMER_GROUP, CONSUMER_NAME,
      'STREAMS', STREAM_NAME, '>'
    ) as RedisStreamResponse;

    // No results
    if (!results || results.length === 0) {
      return null;
    }

    const streamMessages = results[0][1];
    // No messages
    if (!streamMessages || streamMessages.length === 0) {
      return null;
    }

    const [messageId, fields] = streamMessages[0];
    const jobIdIndex = fields.indexOf('jobId');
    
    // jobId not found in fields
    if (jobIdIndex === -1 || jobIdIndex + 1 >= fields.length) {
      logger.error('Invalid message format - missing jobId', { messageId, fields });
      return null;
    }

    const jobId = fields[jobIdIndex + 1];
    return { jobId, messageId };
  } finally {
    redisPool.release(redis);
  }
}

// Set job status
export async function setJobStatus(jobId: string, status: JobStatus): Promise<void> {
  const redis = await getRedis();
  try {
    await redis.set(`job:${jobId}:status`, JSON.stringify(status), 'EX', JOB_TTL);
  } finally {
    redisPool.release(redis);
  }
}

// Get job status
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const redis = await getRedis();
  try {
    const status = await redis.get(`job:${jobId}:status`);
    return status ? JSON.parse(status) : null;
  } finally {
    redisPool.release(redis);
  }
}

// Acknowledge job completion
export async function acknowledgeJob(messageId: string): Promise<void> {
  const redis = await getRedis();
  try {
    await redis.xack(STREAM_NAME, CONSUMER_GROUP, messageId);
  } finally {
    redisPool.release(redis);
  }
}

// Cleanup scheduler
let cleanupInterval: NodeJS.Timeout;

export async function startCleanupScheduler(): Promise<void> {
  try {
    await cleanupExpiredKeys();
    cleanupInterval = setInterval(cleanupExpiredKeys, 60 * 60 * 1000); // Run every hour
  } catch (error) {
    logger.error('Failed to start cleanup scheduler', { error });
    throw error;
  }
}

export async function stopCleanupScheduler(): Promise<void> {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  await redisPool.cleanup();
}

async function cleanupExpiredKeys(): Promise<void> {
  const redis = await getRedis();
  try {
    // Clean up expired job statuses
    const keys = await redis.keys('job:*:status');
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1 || ttl === -2) {
        await redis.del(key);
      }
    }
  } finally {
    redisPool.release(redis);
  }
}

// OAuth token management
const OAUTH_TOKEN_PREFIX = 'notion_oauth:';
const OAUTH_TOKEN_TTL = 60 * 60 * 24 * 30; // 30 days

export async function storeOAuthToken(
  tokenData: string,
  workspaceId: string,
  databaseId: string,
  userId: string
): Promise<void> {
  const redis = await getRedis();
  try {
    const key = `${OAUTH_TOKEN_PREFIX}${workspaceId}`;
    await redis.set(key, tokenData, 'EX', OAUTH_TOKEN_TTL);
    
    // Store additional metadata
    await redis.hset(`${key}:meta`, {
      databaseId,
      userId,
      lastUpdated: Date.now()
    });
  } finally {
    redisPool.release(redis);
  }
}

export async function getOAuthToken(workspaceId?: string): Promise<string | null> {
  const redis = await getRedis();
  try {
    if (!workspaceId) {
      // Get first available token if no workspace specified
      const keys = await redis.keys(`${OAUTH_TOKEN_PREFIX}*`);
      if (keys.length === 0) return null;
      workspaceId = keys[0].replace(OAUTH_TOKEN_PREFIX, '');
    }
    
    const token = await redis.get(`${OAUTH_TOKEN_PREFIX}${workspaceId}`);
    if (!token) return null;
    
    // Refresh TTL on access
    await redis.expire(`${OAUTH_TOKEN_PREFIX}${workspaceId}`, OAUTH_TOKEN_TTL);
    return token;
  } finally {
    redisPool.release(redis);
  }
}

export async function refreshOAuthToken(
  workspaceId: string,
  newTokenData: string
): Promise<void> {
  const redis = await getRedis();
  try {
    const key = `${OAUTH_TOKEN_PREFIX}${workspaceId}`;
    await redis.set(key, newTokenData, 'EX', OAUTH_TOKEN_TTL);
    
    // Update metadata
    await redis.hset(`${key}:meta`, {
      lastUpdated: Date.now()
    });
  } finally {
    redisPool.release(redis);
  }
}

export async function deleteOAuthToken(workspaceId: string): Promise<void> {
  const redis = await getRedis();
  try {
    const key = `${OAUTH_TOKEN_PREFIX}${workspaceId}`;
    await redis.del(key);
    await redis.del(`${key}:meta`);
  } finally {
    redisPool.release(redis);
  }
}

export type { RedisType };
export { redisPool };

// Type for Redis stream response
type RedisStreamResponse = Array<[string, Array<[string, string[]]>]>;
