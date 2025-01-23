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
const POOL_SIZE = 5;
const POOL_ACQUIRE_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

interface PoolConnection {
  client: RedisType;
  inUse: boolean;
  lastUsed: number;
}

class RedisPool {
  private pool: PoolConnection[] = [];
  private connectionPromises: Map<number, Promise<RedisType>> = new Map();

  private async createClient(): Promise<RedisType> {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing Redis configuration in environment variables');
    }

    const options = {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      retryStrategy(times: number) {
        logger.debug(`Redis retry attempt ${times}`);
        if (times > MAX_RETRIES) {
          logger.error('Max Redis retries reached');
          return null;
        }
        const delay = Math.min(times * RETRY_DELAY, 3000);
        logger.debug(`Redis retry in ${delay}ms`);
        return delay;
      },
      reconnectOnError(err: Error) {
        logger.debug('Redis reconnect check:', err.message);
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          logger.debug('Redis reconnecting due to READONLY error');
          return true;
        }
        return false;
      }
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
      this.pool.push({
        client,
        inUse: false,
        lastUsed: Date.now()
      });
    }
  }

  public async acquire(): Promise<RedisType> {
    // Initialize pool if needed
    if (this.pool.length === 0) {
      await this.initializePool();
    }

    // Find available connection
    const availableConnection = this.pool.find(conn => !conn.inUse);
    if (availableConnection) {
      availableConnection.inUse = true;
      availableConnection.lastUsed = Date.now();

      // Verify connection is working
      try {
        await availableConnection.client.ping();
        return availableConnection.client;
      } catch (error) {
        // Connection failed, create new one
        availableConnection.client = await this.createClient();
        return availableConnection.client;
      }
    }

    // No available connections, wait for one
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout waiting for available Redis connection'));
      }, POOL_ACQUIRE_TIMEOUT);

      const checkPool = async () => {
        const conn = this.pool.find(conn => !conn.inUse);
        if (conn) {
          clearTimeout(timeoutId);
          conn.inUse = true;
          conn.lastUsed = Date.now();
          try {
            await conn.client.ping();
            resolve(conn.client);
          } catch (error) {
            conn.client = await this.createClient();
            resolve(conn.client);
          }
        } else {
          setTimeout(checkPool, 100);
        }
      };

      checkPool();
    });
  }

  public release(client: RedisType): void {
    const connection = this.pool.find(conn => conn.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
    }
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

// Create Redis pool instance
const redisPool = new RedisPool();

// Get Redis client from pool
export async function getRedis(): Promise<RedisType> {
  try {
    logger.debug('=== Redis Client Request ===');
    const client = await redisPool.acquire();
    logger.debug('Redis client acquired from pool');
    return client;
  } catch (error) {
    logger.error('Failed to acquire Redis client:', error);
    throw error;
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

export async function getNextJob(): Promise<string | null> {
  const redis = await getRedis();
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

// Export the redis instance for direct access when needed
export { getRedis as redis };
