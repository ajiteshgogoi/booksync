import { Redis } from 'ioredis';
import type { Redis as RedisType } from 'ioredis';

// Simple console logger implementation
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : ''),
};

// Initialize Redis client
let _redis: RedisType | null = null;

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
let connectionPromise: Promise<RedisType> | null = null;

async function initializeRedis(): Promise<RedisType> {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing Redis configuration in environment variables');
    }

    logger.debug('=== Redis Initialization Start ===');
    logger.debug('Initializing Redis with URL', { url: process.env.REDIS_URL });
    
    // Create Redis client with detailed options
    const options = {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000, // 10 seconds
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

    logger.debug('Creating Redis client with options:', options);
    const redis = new Redis(process.env.REDIS_URL, options);

    // Set up event handlers with detailed logging
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

    // Test connection with retry and detailed logging
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        logger.debug(`Ping attempt ${i + 1}/${MAX_RETRIES}...`);
        await redis.ping();
        logger.info(`✅ Redis ping successful on attempt ${i + 1}`);
        return redis;
      } catch (error) {
        if (i === MAX_RETRIES - 1) {
          logger.error('❌ All Redis ping attempts failed');
          throw error;
        }
        logger.warn(`⚠️ Redis ping attempt ${i + 1} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    throw new Error('Failed to establish Redis connection after retries');
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error });
    throw error;
  }
}

export async function getRedis(): Promise<RedisType> {
  try {
    logger.debug('=== Redis Client Request ===');
    
    // Check if existing client is truly ready
    if (_redis?.status === 'ready') {
      try {
        // Verify connection is actually working with timeout
        const pingPromise = _redis.ping();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout')), 5000)
        );
        await Promise.race([pingPromise, timeoutPromise]);
        logger.debug('✅ Existing Redis client verified');
        return _redis;
      } catch (pingError) {
        logger.warn('⚠️ Existing Redis client failed verification:', {
          error: pingError instanceof Error ? pingError.message : String(pingError),
          status: _redis.status
        });
        _redis = null; // Clear the failed client
      }
    } else if (_redis) {
      logger.warn('⚠️ Existing Redis client not ready:', {
        status: _redis.status,
        connected: _redis.status === 'connecting'
      });
      _redis = null;
    }

    // Handle concurrent connection attempts with timeout
    if (!connectionPromise) {
      logger.debug('Creating new Redis connection...');
      connectionPromise = Promise.race<RedisType>([
        initializeRedis()
          .then(redis => {
            logger.debug('✅ New Redis connection established');
            _redis = redis;
            connectionPromise = null;
            return redis;
          })
          .catch(error => {
            logger.error('❌ Failed to establish Redis connection:', {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
            connectionPromise = null;
            throw error;
          }),
        new Promise<RedisType>((_, reject) =>
          setTimeout(() => {
            connectionPromise = null;
            reject(new Error('Redis connection timeout after 10s'));
          }, 10000)
        )
      ]);
    } else {
      logger.debug('Using existing connection promise...');
    }

    const newRedis = await connectionPromise;
    if (!newRedis) {
      throw new Error('Failed to create Redis client');
    }
    
    // Final verification
    await newRedis.ping();
    logger.debug('Redis client ready and verified');
    return newRedis;
  } catch (error) {
    // Clean up on failure
    if (_redis) {
      try {
        await _redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
      _redis = null;
    }
    connectionPromise = null;

    logger.error('Redis client acquisition failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: process.env.REDIS_URL ? 'configured' : 'missing'
    });
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

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX = 10; // Max requests per window

// Cache TTLs
const BOOK_TTL = 60 * 60 * 24; // 24 hours
const HIGHLIGHT_TTL = 60 * 60 * 24; // 24 hours
const PAGE_ID_TTL = 60 * 60 * 24; // 24 hours
const TOKEN_TTL = 60 * 60 * 24; // 24 hours

// Queue functions
export async function addJobToQueue(jobId: string): Promise<void> {
  let redis;
  try {
    redis = await getRedis();
    await redis.rpush(QUEUE_NAME, jobId);
    await setJobStatus(jobId, { state: 'pending' });
    logger.debug('Job added to queue', { jobId });
  } catch (error) {
    logger.error('Failed to add job to queue', { jobId, error });
    throw error;
  } finally {
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

export async function getNextJob(): Promise<string | null> {
  let redis;
  try {
    redis = await getRedis();
    
    // First check queue length
    const queueLength = await redis.llen(QUEUE_NAME);
    logger.debug('Current queue length', { queueLength });

    // List all jobs in queue
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
  } finally {
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

export async function setJobStatus(jobId: string, status: JobStatus): Promise<void> {
  let redis;
  try {
    redis = await getRedis();
    await redis.set(`job:${jobId}:status`, JSON.stringify(status), 'EX', JOB_TTL);
    logger.debug('Job status updated', { jobId, status });
  } catch (error) {
    logger.error('Failed to set job status', { jobId, error });
    throw error;
  } finally {
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  let redis;
  try {
    redis = await getRedis();
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
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

// Token management
export async function storeOAuthToken(token: string, workspaceId: string, databaseId: string, userId: string): Promise<void> {
  let redis;
  try {
    redis = await getRedis();
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
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

export async function getOAuthToken(): Promise<string | null> {
  let redis;
  try {
    redis = await getRedis();
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
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

export async function refreshOAuthToken(token: string, workspaceId: string): Promise<void> {
  let redis;
  try {
    redis = await getRedis();
    await redis.set(`oauth:${workspaceId}`, token, 'EX', TOKEN_TTL);
    logger.debug('OAuth token refreshed', { workspaceId });
  } catch (error) {
    logger.error('Failed to refresh OAuth token', { workspaceId, error });
    throw error;
  } finally {
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

export async function deleteOAuthToken(): Promise<void> {
  let redis;
  try {
    redis = await getRedis();
    const keys = await redis.keys('oauth:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('OAuth token deleted');
    }
  } catch (error) {
    logger.error('Failed to delete OAuth token', { error });
    throw error;
  } finally {
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

// Rate limiting
export async function checkRateLimit(databaseId: string): Promise<boolean> {
  let redis;
  try {
    redis = await getRedis();
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
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
  }
}

// Cleanup configuration
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run cleanup every hour

// Function to clean up expired keys
async function cleanupExpiredKeys(): Promise<void> {
  let redis;
  try {
    redis = await getRedis();
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
    if (redis) {
      try {
        await redis.quit();
      } catch (quitError) {
        logger.warn('Failed to quit Redis client:', quitError);
      }
    }
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
}

// Export the redis instance for direct access when needed
export { getRedis as redis };
