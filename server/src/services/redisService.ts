import { Redis } from 'ioredis';
import type { Redis as RedisType } from 'ioredis';

// Simple console logger implementation
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
};

// Connection pool configuration
const POOL_SIZE = 2; // Reduced from 5 to 2 to conserve connections
const POOL_ACQUIRE_TIMEOUT = 5000; // Reduced from 10 to 5 seconds
const MAX_RETRIES = 2; // Reduced from 3
const RETRY_DELAY = 500; // Reduced from 1000ms
const CONNECTION_TIMEOUT = 10000; // Reduced from 30s to 10s max connection usage time
const CONNECTION_MAX_AGE = 300000; // Reduced from 1h to 5m max connection age
const CONNECTION_IDLE_TIMEOUT = 60000; // Reduced from 5m to 1m idle timeout
const REAPER_INTERVAL = 30000; // Run reaper every 30s instead of 1m

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
  private connectionPromises: Map<number, Promise<RedisType>> = new Map();

  private async createClient(): Promise<RedisType> {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing Redis configuration in environment variables');
    }

    const options = {
      maxRetriesPerRequest: 1, // Reduced from 3
      connectTimeout: 5000, // Reduced from 10000
      retryStrategy(times: number) {
        logger.debug(`Redis retry attempt ${times}`);
        if (times > MAX_RETRIES) {
          logger.error('Max Redis retries reached');
          return null;
        }
        const delay = Math.min(times * RETRY_DELAY, 1000); // Reduced max delay from 3000ms
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
      enableOfflineQueue: true, // Enable offline queue to handle temporary connection issues
      enableReadyCheck: true, // Add ready check to ensure connection is valid
      commandTimeout: 5000, // Timeout for individual commands
      socketInitialDelay: 1000, // Initial delay before reconnecting
      maxLoadingRetryTime: 30000, // Max time to wait for Redis to load data
      autoResendUnfulfilledCommands: true // Automatically resend commands that failed due to connection issues
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
    // Start the connection reaper when pool is created
    this.startConnectionReaper();
  }

  public async acquire(): Promise<RedisType> {
    // Initialize pool if needed
    if (this.pool.length === 0) {
      await this.initializePool();
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
              resolve(availableConn.client);
            } else {
              await this.replaceConnection(availableConn);
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

  private async validateConnection(connection: PoolConnection): Promise<boolean> {
    try {
      await connection.client.ping();
      return true;
    } catch (error) {
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
    } catch (error) {
      logger.warn(`Error closing stale connection ${connection.id}:`, error);
    }

    const now = Date.now();
    const index = this.pool.indexOf(connection);
    if (index !== -1) {
      const newClient = await this.createClient();
      this.pool[index] = {
        client: newClient,
        inUse: false,
        lastUsed: now,
        acquiredAt: null,
        createdAt: now,
        id: `conn-${now}-${index}`
      };
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
    const connection = this.pool.find(conn => conn.client === client);
    if (connection) {
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
    for (const conn of this.pool) {
      if (conn.client) {
        try {
          await conn.client.quit();
        } catch (error) {
          logger.warn('Error closing Redis connection:', error);
        }
      }
    }
    this.pool = [];
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

// Queue configuration
export const QUEUE_NAME = 'sync_jobs';
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
  lastProcessedIndex?: number;  // Track the last processed highlight index
};

// Queue functions
export async function addJobToQueue(jobId: string, existingRedis?: RedisType): Promise<void> {
  const redis = existingRedis || await getRedis();
  try {
    await redis.rpush(QUEUE_NAME, jobId);
    await setJobStatus(jobId, { state: 'pending' }, redis);
    logger.debug('Job added to queue', { jobId });
  } catch (error) {
    logger.error('Failed to add job to queue', { jobId, error });
    throw error;
  }
}

export async function getNextJob(existingRedis?: RedisType): Promise<string | null> {
  const redis = existingRedis || await getRedis();
  try {
    const queueLength = await redis.llen(QUEUE_NAME);
    logger.debug('Current queue length', { queueLength });

    const allJobs = await redis.lrange(QUEUE_NAME, 0, -1);
    logger.debug('All jobs in queue', { jobs: allJobs });

    const jobId = await redis.lpop(QUEUE_NAME);
    if (jobId) {
      logger.debug('Retrieved next job from queue', { jobId });
    } else {
      logger.debug('No jobs available in queue');
    }
    return jobId;
  } catch (error) {
    logger.error('Failed to get next job from queue', { error });
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

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const redis = await getRedis();
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
    redisPool.release(redis);
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
