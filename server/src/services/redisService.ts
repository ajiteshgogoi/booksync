import Redis from 'ioredis';

// Simple console logger implementation
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data),
};

// Initialize Redis client
let _redis: Redis | null = null;

async function initializeRedis(): Promise<Redis> {
  try {
    if (!process.env.REDIS_URL) {
      throw new Error('Missing Redis configuration in environment variables');
    }

    const redis = new Redis(process.env.REDIS_URL);

    // Debug log environment variables
    logger.debug('Redis environment variables', {
      url: process.env.REDIS_URL
    });

    // Test connection
    await redis.ping();
    logger.info('Redis client initialized successfully', {
      url: process.env.REDIS_URL
    });
    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error });
    throw error;
  }
}

export async function getRedis(): Promise<Redis> {
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
  state: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  result?: any;
  total?: number;
  lastCheckpoint?: number;
  completedAt?: number;
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX = 10; // Max requests per window

// Cache TTLs
const BOOK_TTL = 60 * 60 * 24; // 24 hours
const HIGHLIGHT_TTL = 60 * 60 * 24; // 24 hours
const PAGE_ID_TTL = 60 * 60 * 24; // 24 hours
const TOKEN_TTL = 60 * 60 * 2; // 2 hours

// Token management
export async function storeOAuthToken(token: string, workspaceId: string): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.set(`oauth:${workspaceId}`, token, 'EX', TOKEN_TTL);
    logger.debug('OAuth token stored', { workspaceId });
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
    const token = await redis.get(keys[0]);
    if (token) {
      logger.debug('Retrieved OAuth token');
      return token;
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
    const jobId = await redis.lpop(QUEUE_NAME);
    if (jobId) {
      logger.debug('Retrieved next job from queue', { jobId });
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
      logger.debug('Retrieved job status', { jobId });
      return JSON.parse(status);
    }
    return null;
  } catch (error) {
    logger.error('Failed to get job status', { jobId, error });
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

// Highlight caching
export async function isHighlightCached(databaseId: string, title: string, highlight: any): Promise<boolean> {
  try {
    const redis = await getRedis();
    const key = `highlight:${databaseId}:${title}:${highlight.hash}`;
    const exists = await redis.exists(key);
    logger.debug('Highlight cache check', {
      databaseId,
      title,
      hash: highlight.hash,
      cached: exists === 1
    });
    return exists === 1;
  } catch (error) {
    logger.error('Highlight cache check failed', {
      databaseId,
      title,
      error
    });
    return false;
  }
}

export async function cacheHighlight(databaseId: string, title: string, highlight: any): Promise<void> {
  try {
    const redis = await getRedis();
    const key = `highlight:${databaseId}:${title}:${highlight.hash}`;
    await redis.set(key, JSON.stringify(highlight), 'EX', HIGHLIGHT_TTL);
    logger.debug('Highlight cached', {
      databaseId,
      title,
      hash: highlight.hash
    });
  } catch (error) {
    logger.error('Failed to cache highlight', {
      databaseId,
      title,
      error
    });
    throw error;
  }
}

// Book page caching
export async function getCachedBookPageId(databaseId: string, title: string): Promise<string | null> {
  try {
    const redis = await getRedis();
    const pageId = await redis.get(`page_id:${databaseId}:${title}`);
    logger.debug('Retrieved cached book page ID', {
      databaseId,
      title,
      cached: !!pageId
    });
    return pageId;
  } catch (error) {
    logger.error('Failed to get cached book page ID', {
      databaseId,
      title,
      error
    });
    throw error;
  }
}

export async function cacheBookPageId(databaseId: string, title: string, pageId: string): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.set(`page_id:${databaseId}:${title}`, pageId, 'EX', PAGE_ID_TTL);
    logger.debug('Book page ID cached', {
      databaseId,
      title
    });
  } catch (error) {
    logger.error('Failed to cache book page ID', {
      databaseId,
      title,
      error
    });
    throw error;
  }
}

// Book caching
export async function getCachedBook(databaseId: string, title: string): Promise<any> {
  try {
    const redis = await getRedis();
    const cached = await redis.get(`book:${databaseId}:${title}`);
    if (cached) {
      logger.debug('Retrieved cached book', {
        databaseId,
        title
      });
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    logger.error('Failed to get cached book', {
      databaseId,
      title,
      error
    });
    throw error;
  }
}

export async function cacheBook(databaseId: string, book: any): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.set(`book:${databaseId}:${book.title}`, JSON.stringify(book), 'EX', BOOK_TTL);
    logger.debug('Book cached', {
      databaseId,
      title: book.title
    });
  } catch (error) {
    logger.error('Failed to cache book', {
      databaseId,
      title: book.title,
      error
    });
    throw error;
  }
}

export async function invalidateBookCache(databaseId: string, title: string): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.del(`book:${databaseId}:${title}`);
    logger.debug('Book cache invalidated', {
      databaseId,
      title
    });
  } catch (error) {
    logger.error('Failed to invalidate book cache', {
      databaseId,
      title,
      error
    });
    throw error;
  }
}

// Cache clearing
export async function clearDatabaseCaches(databaseId: string): Promise<void> {
  try {
    const redis = await getRedis();
    const keys = await redis.keys(`*:${databaseId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('Cleared database caches', {
        databaseId,
        keysCleared: keys.length
      });
    }
  } catch (error) {
    logger.error('Failed to clear database caches', {
      databaseId,
      error
    });
    throw error;
  }
}

// Add metrics collection
export async function getRedisMetrics(): Promise<{
  cacheHitRate: number;
  errorRate: number;
  operations: number;
}> {
  try {
    const redis = await getRedis();
    const [hits, misses, errors, operations] = await redis.mget(
      'stats:cache:hits',
      'stats:cache:misses',
      'stats:errors',
      'stats:operations'
    );
    
    const hitsNum = parseInt(hits ?? '0');
    const missesNum = parseInt(misses ?? '0');
    const errorsNum = parseInt(errors ?? '0');
    const operationsNum = parseInt(operations ?? '0');
    
    const hitRate = hitsNum + missesNum > 0 ? hitsNum / (hitsNum + missesNum) : 0;
    
    return {
      cacheHitRate: hitRate,
      errorRate: errorsNum / Math.max(operationsNum, 1),
      operations: operationsNum
    };
  } catch (error) {
    logger.error('Failed to get Redis metrics', { error });
    return {
      cacheHitRate: 0,
      errorRate: 0,
      operations: 0
    };
  }
}

// Export the redis instance for direct access when needed
export { getRedis as redis };
