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

async function initializeRedis(): Promise<RedisType> {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing Redis configuration in environment variables');
    }

    logger.debug('Initializing Redis with URL', { url: process.env.REDIS_URL });
    const redis = new Redis(process.env.REDIS_URL);

    // Test connection
    await redis.ping();
    logger.info('Redis client initialized successfully');
    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error });
    throw error;
  }
}

export async function getRedis(): Promise<RedisType> {
  if (!_redis) {
    _redis = await initializeRedis();
  }
  return _redis;
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
  try {
    const redis = await getRedis();
    await redis.rpush(QUEUE_NAME, jobId);
    await setJobStatus(jobId, { state: 'pending' });
    logger.debug('Job added to queue', { jobId });
  } catch (error) {
    logger.error('Failed to add job to queue', { jobId, error });
    throw error;
  }
}

export async function getNextJob(): Promise<string | null> {
  try {
    const redis = await getRedis();
    
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
  }
}

export async function setJobStatus(jobId: string, status: JobStatus): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.set(`job:${jobId}:status`, JSON.stringify(status), 'EX', JOB_TTL);
    logger.debug('Job status updated', { jobId, status });
  } catch (error) {
    logger.error('Failed to set job status', { jobId, error });
    throw error;
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  try {
    const redis = await getRedis();
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
  try {
    const redis = await getRedis();
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
  try {
    const redis = await getRedis();
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
  try {
    const redis = await getRedis();
    await redis.set(`oauth:${workspaceId}`, token, 'EX', TOKEN_TTL);
    logger.debug('OAuth token refreshed', { workspaceId });
  } catch (error) {
    logger.error('Failed to refresh OAuth token', { workspaceId, error });
    throw error;
  }
}

export async function deleteOAuthToken(): Promise<void> {
  try {
    const redis = await getRedis();
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

// Rate limiting
export async function checkRateLimit(databaseId: string): Promise<boolean> {
  try {
    const redis = await getRedis();
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
  try {
    const redis = await getRedis();
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
}

// Export the redis instance for direct access when needed
export { getRedis as redis };
