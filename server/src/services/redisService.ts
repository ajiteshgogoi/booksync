import { Redis } from 'ioredis';
import type { Redis as RedisType } from 'ioredis';

// Simple console logger implementation
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
};

// Connection pool configuration - optimized for Redis Cloud free tier (30 max connections)
const POOL_SIZE = process.env.VERCEL ? 5 : 8; // Conservative pool size to leave room for RedisInsight and other connections
const POOL_ACQUIRE_TIMEOUT = process.env.VERCEL ? 2000 : 5000; // Moderate timeouts
const MAX_RETRIES = process.env.VERCEL ? 2 : 3; // Moderate retries
const RETRY_DELAY = 1000; // Keep increased retry delay

const CONNECTION_TIMEOUT = 20000; // Moderate connection timeout
const CONNECTION_MAX_AGE = 300000; // Back to 5 minutes to encourage connection recycling
const CONNECTION_IDLE_TIMEOUT = 30000; // Back to 30 seconds for idle timeout
const REAPER_INTERVAL = 15000; // More frequent reaping
const MAX_CONNECTION_WAITERS = 10; // Conservative number of waiters
interface PoolConnection {
  client: RedisType;
  inUse: boolean;
  lastUsed: number;
  acquiredAt: number | null;
  createdAt: number;
  id: string;
}

class RedisPool {
  private pool: PoolConnection[] = [];
  private sharedConnections: PoolConnection[] = [];
  private connectionPromises: Map<number, Promise<RedisType>> = new Map();
  private connectionWaiters: number = 0;
  private connectionStats = {
    totalAcquires: 0,
    totalReleases: 0,
    totalTimeouts: 0,
    totalErrors: 0,
    maxWaiters: 0,
    totalStaleConnections: 0,
    totalReconnects: 0,
    totalForcedReleases: 0,
    totalPoolHits: 0,
    totalPoolMisses: 0,
    lastError: null as unknown,
    lastErrorTimestamp: 0,
    lastAcquireDuration: 0,
    lastReleaseDuration: 0
  };

  private async createClient(): Promise<RedisType> {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing Redis configuration in environment variables');
    }

    const options = {
      maxRetriesPerRequest: 2, // Conservative retries to avoid connection spam
      connectTimeout: 8000, // Moderate connect timeout
      retryStrategy(times: number) {
        logger.debug(`Redis retry attempt ${times}`);
        if (times > MAX_RETRIES) {
          logger.error('Max Redis retries reached');
          return null;
        }
        const delay = Math.min(times * RETRY_DELAY, 3000); // Moderate max delay
        logger.debug(`Redis retry in ${delay}ms`);
        return delay;
      },
      reconnectOnError(err: Error) {
        logger.debug('Redis reconnect check:', err.message);
        // Only reconnect on critical errors
        const targetErrors = ['READONLY', 'ERR max number of clients reached'];
        if (targetErrors.some(e => err.message.includes(e))) {
          logger.debug(`Redis reconnecting due to ${err.message}`);
          return true;
        }
        return false;
      },
      enableAutoPipelining: true, // Add pipelining to optimize connection usage
      enableOfflineQueue: false, // Disable offline queue to fail fast on errors
      enableReadyCheck: true, // Add ready check to ensure connection is valid
      commandTimeout: 8000, // Increased timeout for commands
      socketInitialDelay: 2000, // Increased initial delay before reconnecting
      maxLoadingRetryTime: 15000, // Reduced max time to wait for Redis to load data
      autoResendUnfulfilledCommands: false // Don't auto-resend failed commands
    };

    const redis = new Redis(process.env.REDIS_URL, options);

    redis.on('connect', () => {
      logger.info('✅ Redis client connected successfully');
    });
    redis.on('error', (error) => {
      logger.error('❌ Redis client error:', {
        error: error.message,
        stack: error.stack
      });
    });
    redis.on('reconnecting', (attempt: number) => {
      logger.info('⏳ Redis client reconnecting:', { attempt });
    });

    // Test connection
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

  private static instance: RedisPool | null = null;

  public static getInstance(): RedisPool {
    if (!RedisPool.instance) {
      RedisPool.instance = new RedisPool();
    }
    return RedisPool.instance;
  }

  constructor() {
    // Initialize shared connections array
    this.sharedConnections = [];
    
    // Start the connection reaper when pool is created
    this.startConnectionReaper();

    // Add Vercel-specific cleanup handlers
    if (process.env.VERCEL) {
      // Cleanup on function completion
      process.on('beforeExit', async () => {
        logger.info('Vercel function completing - cleaning up Redis connections');
        await this.cleanup();
      });

      // Cleanup on SIGTERM
      process.on('SIGTERM', async () => {
        logger.info('Vercel function terminating - cleaning up Redis connections');
        await this.cleanup();
        process.exit(0);
      });
    }
  }

  public async acquire(): Promise<RedisType> {
    // Check connection waiter limit
    if (this.connectionWaiters >= MAX_CONNECTION_WAITERS) {
      this.connectionStats.totalErrors++;
      throw new Error('Maximum number of connection waiters reached');
    }

    this.connectionWaiters++;
    this.connectionStats.maxWaiters = Math.max(
      this.connectionStats.maxWaiters,
      this.connectionWaiters
    );

    try {
      // Initialize pool if needed
      if (this.pool.length === 0) {
        await this.initializePool();
      }
    } catch (error) {
      this.connectionWaiters--;
      throw error;
    }

    const now = Date.now();

    // First pass: look for available valid connections
    for (const connection of this.pool) {
      if (!connection.inUse) {
        const isStale = await this.isConnectionStale(connection);
        if (!isStale && await this.validateConnection(connection)) {
          connection.inUse = true;
          connection.lastUsed = now;
          connection.acquiredAt = now;
          return connection.client;
        } else {
          // Connection invalid or stale, replace it
          await this.replaceConnection(connection);
        }
      }
    }

    // Second pass: force release stale connections if all are in use
    const staleConnection = this.pool.find(conn =>
      conn.inUse &&
      conn.acquiredAt &&
      now - conn.acquiredAt > CONNECTION_TIMEOUT
    );

    if (staleConnection) {
      await this.forceRelease(staleConnection);
      staleConnection.inUse = true;
      staleConnection.lastUsed = now;
      staleConnection.acquiredAt = now;
      return staleConnection.client;
    }

    // Wait for a connection with timeout
    return new Promise((resolve, reject) => {
      this.connectionStats.totalAcquires++;
      const timeoutId = setTimeout(async () => {
        // On timeout, try to force release the longest-held connection
        const oldestConnection = this.pool
          .filter(conn => conn.inUse && conn.acquiredAt)
          .sort((a, b) => (a.acquiredAt || 0) - (b.acquiredAt || 0))[0];

        if (oldestConnection) {
          try {
            await this.forceRelease(oldestConnection);
            oldestConnection.inUse = true;
            oldestConnection.lastUsed = Date.now();
            oldestConnection.acquiredAt = Date.now();
            resolve(oldestConnection.client);
          } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            reject(new Error('Failed to acquire Redis connection: ' + errorMessage));
          }
        } else {
          reject(new Error('Timeout waiting for available Redis connection'));
        }
      }, POOL_ACQUIRE_TIMEOUT);

      const checkPoolInterval = setInterval(async () => {
        try {
            const availableConn = this.pool.find(conn => !conn.inUse);
            if (availableConn) {
              clearTimeout(timeoutId);
              clearInterval(checkPoolInterval);
              
              availableConn.inUse = true;
              availableConn.lastUsed = now;
              availableConn.acquiredAt = now;
              
              if (await this.validateConnection(availableConn)) {
                this.connectionWaiters--;
                resolve(availableConn.client);
              } else {
                await this.replaceConnection(availableConn);
                this.connectionWaiters--;
                resolve(availableConn.client);
              }
            }
        } catch (error) {
          clearInterval(checkPoolInterval);
          clearTimeout(timeoutId);
          reject(error);
        }
      }, 100);
    });
  }

    public async validateClientConnection(client: RedisType): Promise<boolean> {
      try {
        await client.ping();
        return true;
      } catch (error) {
        return false;
      }
    }
  
    private async validateConnection(connection: PoolConnection): Promise<boolean> {
      const validationStart = Date.now();
      try {
        await connection.client.ping();
        this.connectionStats.lastAcquireDuration = Date.now() - validationStart;
        return true;
      } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        this.connectionStats.lastError = typedError as Error | null;
        this.connectionStats.lastErrorTimestamp = Date.now();
        this.connectionStats.totalErrors++;
        logger.warn(`Connection validation failed for ${connection.id}:`, error);
        return false;
      }
    const start = Date.now();
    try {
      await connection.client.ping();
      this.connectionStats.lastAcquireDuration = Date.now() - start;
      return true;
    } catch (error) {
      this.connectionStats.lastError = error instanceof Error ? error : new Error(String(error));
      this.connectionStats.lastErrorTimestamp = Date.now();
      this.connectionStats.totalErrors++;
      logger.warn(`Connection validation failed for ${connection.id}:`, error);
      return false;
    }
  }

  private async isConnectionStale(connection: PoolConnection): Promise<boolean> {
    const now = Date.now();
    
    // Immediately validate connection if it's not in use
    if (!connection.inUse && !await this.validateConnection(connection)) {
      return true;
    }

    // Check if connection is too old
    if (now - connection.createdAt > CONNECTION_MAX_AGE) {
      return true;
    }
    
    // Check if connection has been idle too long
    if (!connection.inUse && now - connection.lastUsed > CONNECTION_IDLE_TIMEOUT) {
      return true;
    }
    
    // Check if connection has been in use too long
    if (connection.inUse && connection.acquiredAt &&
        now - connection.acquiredAt > CONNECTION_TIMEOUT) {
      return true;
    }
    
    return false;
  }

  private async replaceConnection(connection: PoolConnection): Promise<void> {
    try {
      await connection.client.quit();
      this.connectionStats.totalStaleConnections++;
    } catch (error) {
      logger.warn(`Error closing stale connection ${connection.id}:`, error);
      this.connectionStats.totalErrors++;
    }

    const now = Date.now();
    const index = this.pool.indexOf(connection);
    if (index !== -1) {
      try {
        const newClient = await this.createClient();
        this.pool[index] = {
          client: newClient,
          inUse: false,
          lastUsed: now,
          acquiredAt: null,
          createdAt: now,
          id: `conn-${now}-${index}`
        };
        this.connectionStats.totalReconnects++;
      } catch (error) {
        logger.error('Failed to create replacement connection:', error);
        this.connectionStats.totalErrors++;
        throw error;
      }
    }
  }

  private startConnectionReaper(): void {
    setInterval(async () => {
      logger.debug('Running connection reaper...');
      for (const connection of this.pool) {
        // Skip connections that are in use and not timed out
        if (connection.inUse &&
            (!connection.acquiredAt ||
             Date.now() - connection.acquiredAt <= CONNECTION_TIMEOUT)) {
          continue;
        }

        try {
          const isStale = await this.isConnectionStale(connection);
          if (isStale) {
            logger.info(`Replacing stale connection ${connection.id}`);
            await this.replaceConnection(connection);
          }
        } catch (error) {
          logger.error(`Error checking connection ${connection.id}:`, error);
        }
      }
    }, REAPER_INTERVAL);
  }

  public release(client: RedisType): void {
    const start = Date.now();
    this.connectionStats.totalReleases++;
    const connection = this.pool.find(conn => conn.client === client);
    if (connection) {
      // Track release duration
      this.connectionStats.lastReleaseDuration = Date.now() - start;
      
      // Log connection stats periodically
      if (this.connectionStats.totalReleases % 10 === 0) {
        logger.info('Redis connection pool stats', {
          poolSize: this.pool.length,
          inUse: this.pool.filter(conn => conn.inUse).length,
          waiters: this.connectionWaiters,
          stats: this.connectionStats
        });
      }
      
      // Track pool hits/misses
      if (connection.acquiredAt && Date.now() - connection.acquiredAt < CONNECTION_TIMEOUT) {
        this.connectionStats.totalPoolHits++;
      } else {
        this.connectionStats.totalPoolMisses++;
      }
      // Force release if connection has been in use too long
      if (connection.acquiredAt && Date.now() - connection.acquiredAt > CONNECTION_TIMEOUT) {
        this.forceRelease(connection).catch(err => {
          logger.warn('Error force releasing connection:', err);
        });
        return;
      }
      
      connection.inUse = false;
      connection.lastUsed = Date.now();
      connection.acquiredAt = null;
      
      // If connection is stale, replace it
      this.isConnectionStale(connection).then(isStale => {
        if (isStale) {
          this.replaceConnection(connection).catch(err => {
            logger.warn('Error replacing stale connection:', err);
          });
        }
      });
    }
  }

  public async forceRelease(connection: PoolConnection): Promise<void> {
    if (!connection.inUse) return;

    logger.warn(`Force releasing connection ${connection.id}`);
    await this.replaceConnection(connection);
  }

  public async cleanup(): Promise<void> {
    // Close all connections
    const connections = [...this.pool, ...this.sharedConnections];
    for (const conn of connections) {
      if (conn.client) {
        try {
          await conn.client.quit();
        } catch (error) {
          logger.warn('Error closing Redis connection:', error);
        }
      }
    }
    this.pool = [];
    this.sharedConnections = [];
  }

  public async getSharedConnection(): Promise<RedisType> {
    if (this.sharedConnections.length > 0) {
      const conn = this.sharedConnections.pop()!;
      conn.inUse = true;
      conn.lastUsed = Date.now();
      conn.acquiredAt = Date.now();
      return conn.client;
    }
    return await this.acquire();
  }

  public releaseSharedConnection(client: RedisType): void {
    const connection = this.pool.find(conn => conn.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
      connection.acquiredAt = null;
      this.sharedConnections.push(connection);
    }
  }

  private startConnectionMonitor(): void {
    setInterval(() => {
      logger.info('Connection pool status', {
        totalConnections: this.pool.length,
        inUse: this.pool.filter(c => c.inUse).length,
        sharedConnections: this.sharedConnections.length,
        waiters: this.connectionWaiters,
        stats: this.connectionStats
      });
    }, 30000); // Log every 30 seconds
  }
}

// Create Redis pool instance using singleton pattern
const redisPool = RedisPool.getInstance();

// Get Redis client from pool with auto-release wrapper
export async function getRedis(): Promise<RedisType> {
  try {
    logger.debug('=== Redis Client Request ===');
    const client = await redisPool.acquire();
    logger.debug('Redis client acquired from pool');

    // Wrap the client to ensure automatic release after operations
    const handler: ProxyHandler<RedisType> = {
      get(target: RedisType, prop: string | symbol) {
        const original = Reflect.get(target, prop);
        if (typeof original === 'function') {
          return async function(this: any, ...args: unknown[]) {
            try {
              const result = await original.apply(this === proxy ? target : this, args);
              redisPool.release(target); // Release connection after successful operation
              return result;
            } catch (error) {
              redisPool.release(target);
              throw error;
            }
          };
        }
        return original;
      }
    };

    const proxy = new Proxy(client, handler);
    return proxy;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to acquire Redis client:', { error: errorMessage });
    throw new Error(`Failed to acquire Redis client: ${errorMessage}`);
  }
}

// Stream configuration
export const STREAM_NAME = 'sync_jobs_stream';
export const CONSUMER_GROUP = 'sync_processors';
export const CONSUMER_NAME = `consumer-${process.pid}`;
export const JOB_TTL = 60 * 60 * 24; // 24 hours

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
export async function initializeStream(existingRedis?: RedisType): Promise<void> {
  const redis = existingRedis || await getRedis();
  try {
    // Create consumer group if it doesn't exist
    try {
      await redis.xgroup('CREATE', STREAM_NAME, CONSUMER_GROUP, '0', 'MKSTREAM');
      logger.info('Created new consumer group', { group: CONSUMER_GROUP });
    } catch (err: any) {
      // Ignore if group already exists
      if (!err.message.includes('BUSYGROUP')) {
        throw err;
      }
    }
  } catch (error) {
    logger.error('Failed to initialize stream', error);
    throw error;
  }
}

// Queue functions
export async function addJobToQueue(jobId: string, existingRedis?: RedisType): Promise<void> {
  const redis = existingRedis || await getRedis();
  try {
    // Add job to stream with job details
    const jobData = {
      jobId,
      timestamp: Date.now().toString()
    };
    
    await redis.xadd(STREAM_NAME, '*', ...Object.entries(jobData).flat());
    await setJobStatus(jobId, { state: 'pending' }, redis);
    logger.debug('Job added to stream', { jobId });
  } catch (error) {
    logger.error('Failed to add job to stream', { jobId, error });
    throw error;
  }
}

// Define types for Redis stream responses
type RedisStreamMessage = [string, string[]]; // [messageId, [field1, value1, field2, value2, ...]]
type RedisStreamEntry = [string, RedisStreamMessage[]]; // [streamName, messages[]]
type RedisStreamResponse = RedisStreamEntry[];

export async function getNextJob(existingRedis?: RedisType): Promise<{ jobId: string; messageId: string } | null> {
  const redis = existingRedis || await getRedis();
  try {
    // Read next message from stream using consumer group
    const results = await redis.xreadgroup(
      'GROUP',
      CONSUMER_GROUP,
      CONSUMER_NAME,
      'STREAMS',
      STREAM_NAME,
      '>'
    ) as RedisStreamResponse | null;

    if (!results || !results[0] || !results[0][1] || !results[0][1][0]) {
      logger.debug('No new jobs available');
      return null;
    }

    const [[_streamName, messages]] = results;
    const [messageId, fields] = messages[0];

    // Convert fields array to object for easier access
    const fieldObj: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      fieldObj[fields[i]] = fields[i + 1];
    }

    if (!fieldObj.jobId) {
      logger.error('Invalid message format - missing jobId', { messageId, fields });
      return null;
    }
    
    logger.debug('Retrieved next job from stream', {
      messageId,
      jobId: fieldObj.jobId
    });

    return { jobId: fieldObj.jobId, messageId };
  } catch (error) {
    logger.error('Failed to get next job from stream', { error });
    throw error;
  }
}

// Acknowledge job completion
export async function acknowledgeJob(messageId: string, existingRedis?: RedisType): Promise<void> {
  const redis = existingRedis || await getRedis();
  try {
    await redis.xack(STREAM_NAME, CONSUMER_GROUP, messageId);
    logger.debug('Acknowledged job completion', { messageId });
  } catch (error) {
    logger.error('Failed to acknowledge job', { messageId, error });
    throw error;
  }
}

export async function setJobStatus(jobId: string, status: JobStatus, existingRedis?: RedisType): Promise<void> {
  const redis = existingRedis || await getRedis();
  try {
    await redis.set(`job:${jobId}:status`, JSON.stringify(status), 'EX', JOB_TTL);
    logger.debug('Job status updated', { jobId, status });
  } catch (error) {
    logger.error('Failed to set job status', { jobId, error });
    throw error;
  }
}

export async function getJobStatus(jobId: string, existingRedis?: RedisType): Promise<JobStatus | null> {
  const redis = existingRedis || await getRedis();
  const shouldRelease = !existingRedis;
  try {
    const status = await redis.get(`job:${jobId}:status`);
    if (status) {
      logger.debug('Retrieved job status', { jobId, status: JSON.parse(status) });
      return JSON.parse(status);
    }
    return null;
  } catch (error) {
    logger.error('Failed to get job status', { jobId, error });
    throw error;
  } finally {
    if (shouldRelease) {
      redisPool.release(redis);
    }
  }
}

// Token management
export async function storeOAuthToken(token: string, workspaceId: string, databaseId: string, userId: string): Promise<void> {
  const redis = await getRedis();
  try {
    const tokenData = {
      token,
      databaseId,
      userId
    };
    await redis.set(`oauth:${workspaceId}`, JSON.stringify(tokenData), 'EX', TOKEN_TTL);
    logger.debug('OAuth token stored', {
      workspaceId,
      databaseId,
      userId,
      tokenLength: token.length
    });
  } catch (error) {
    logger.error('Failed to store OAuth token', { workspaceId, error });
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

export async function getOAuthToken(): Promise<string | null> {
  const redis = await getRedis();
  try {
    const keys = await redis.keys('oauth:*');
    if (keys.length === 0) {
      logger.warn('No OAuth token found');
      return null;
    }
    const tokenData = await redis.get(keys[0]);
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      logger.debug('Retrieved OAuth token');
      return parsed.token;
    }
    return null;
  } catch (error) {
    logger.error('Failed to get OAuth token', { error });
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

export async function refreshOAuthToken(token: string, workspaceId: string): Promise<void> {
  const redis = await getRedis();
  try {
    await redis.set(`oauth:${workspaceId}`, token, 'EX', TOKEN_TTL);
    logger.debug('OAuth token refreshed', { workspaceId });
  } catch (error) {
    logger.error('Failed to refresh OAuth token', { workspaceId, error });
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

export async function deleteOAuthToken(): Promise<void> {
  const redis = await getRedis();
  try {
    const keys = await redis.keys('oauth:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('OAuth token deleted');
    }
  } catch (error) {
    logger.error('Failed to delete OAuth token', { error });
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX = 10; // Max requests per window

// Cache TTLs
const TOKEN_TTL = 60 * 60 * 24; // 24 hours

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
    
    if (requests > RATE_LIMIT_MAX) {
      logger.warn('Rate limit exceeded', { databaseId });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Rate limit check failed', { databaseId, error });
    return true; // Fail open to avoid blocking requests
  } finally {
    redisPool.release(redis);
  }
}

// Cleanup configuration
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run cleanup every hour

// Function to clean up expired keys
async function cleanupExpiredKeys(): Promise<void> {
  const redis = await getRedis();
  try {
    const patterns = [
      'job:*:status',    // Job statuses
      'oauth:*',         // OAuth tokens
      'rate_limit:*'     // Rate limit keys
    ];

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        // If TTL is -1 (no expiry) or -2 (expired), delete the key
        if (ttl === -1 || ttl === -2) {
          await redis.del(key);
          logger.debug('Cleaned up expired key', { key });
        }
      }
    }
    logger.info('Completed Redis key cleanup');
  } catch (error) {
    logger.error('Failed to cleanup expired keys', { error });
  } finally {
    redisPool.release(redis);
  }
}

// Initialize cleanup scheduler
let cleanupInterval: NodeJS.Timeout;

export async function startCleanupScheduler(): Promise<void> {
  try {
    // Run initial cleanup
    await cleanupExpiredKeys();
    
    // Schedule periodic cleanup
    cleanupInterval = setInterval(cleanupExpiredKeys, CLEANUP_INTERVAL);
    logger.info('Redis cleanup scheduler started');
  } catch (error) {
    logger.error('Failed to start cleanup scheduler', { error });
    throw error;
  }
}

export async function stopCleanupScheduler(): Promise<void> {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    logger.info('Redis cleanup scheduler stopped');
  }
  // Clean up Redis pool
  await redisPool.cleanup();
}

// Export types, redis instance, and pool
export type { RedisType };
export { getRedis as redis, redisPool };
