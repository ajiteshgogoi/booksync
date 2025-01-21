import { Redis } from '@upstash/redis';

// Simple console logger implementation
const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data),
  warn: (message: string, data?: any) => console.warn(`[WARN] ${message}`, data),
  error: (message: string, data?: any) => console.error(`[ERROR] ${message}`, data),
  debug: (message: string, data?: any) => console.debug(`[DEBUG] ${message}`, data),
};

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

logger.info('Redis client initialized');

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
const HIGHLIGHT_TTL = 60 * 60 * 24 * 7; // 1 week
const PAGE_ID_TTL = 60 * 60 * 24; // 24 hours
const TOKEN_TTL = 60 * 60 * 2; // 2 hours

// Token management
export async function storeOAuthToken(userId: string, token: string): Promise<void> {
  try {
    await redis.set(`oauth:${userId}`, token, {
      ex: TOKEN_TTL
    });
    logger.debug('OAuth token stored', { userId });
  } catch (error) {
    logger.error('Failed to store OAuth token', { userId, error });
    throw error;
  }
}

export async function getOAuthToken(userId: string): Promise<string | null> {
  try {
    const token = await redis.get<string>(`oauth:${userId}`);
    if (token) {
      logger.debug('Retrieved OAuth token', { userId });
      return token;
    }
    logger.warn('No OAuth token found', { userId });
    return null;
  } catch (error) {
    logger.error('Failed to get OAuth token', { userId, error });
    throw error;
  }
}

export async function refreshOAuthToken(userId: string, token: string): Promise<void> {
  try {
    await redis.set(`oauth:${userId}`, token, {
      ex: TOKEN_TTL,
      keepTtl: undefined
    });
    logger.debug('OAuth token refreshed', { userId });
  } catch (error) {
    logger.error('Failed to refresh OAuth token', { userId, error });
    throw error;
  }
}

export async function deleteOAuthToken(userId: string): Promise<void> {
  try {
    await redis.del(`oauth:${userId}`);
    logger.debug('OAuth token deleted', { userId });
  } catch (error) {
    logger.error('Failed to delete OAuth token', { userId, error });
    throw error;
  }
}

// Queue functions
export async function addJobToQueue(jobId: string): Promise<void> {
  try {
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
    const jobId = await redis.lpop<string>(QUEUE_NAME);
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
    await redis.set(`job:${jobId}:status`, JSON.stringify(status), {
      ex: JOB_TTL
    });
    logger.debug('Job status updated', { jobId, status });
  } catch (error) {
    logger.error('Failed to set job status', { jobId, error });
    throw error;
  }
}

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  try {
    const status = await redis.get<JobStatus | string>(`job:${jobId}:status`);
    if (status) {
      logger.debug('Retrieved job status', { jobId });
      // Handle both string and already-parsed object cases
      return typeof status === 'string' ? JSON.parse(status) : status;
    }
    return null;
  } catch (error) {
    logger.error('Failed to get job status', { jobId, error });
    throw error;
  }
}

// Rate limiting
export async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const key = `rate_limit:${userId}:${currentTime}`;
    
    const requests = await redis.incr(key);
    if (requests === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    
    if (requests > RATE_LIMIT_MAX) {
      logger.warn('Rate limit exceeded', { userId });
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Rate limit check failed', { userId, error });
    return true; // Fail open to avoid blocking requests
  }
}

// Highlight caching
export async function isHighlightCached(userId: string, title: string, highlight: any): Promise<boolean> {
  try {
    const key = `highlight:${userId}:${title}:${highlight.location}`;
    const exists = await redis.exists(key);
    logger.debug('Highlight cache check', { 
      userId, 
      title, 
      location: highlight.location,
      cached: exists === 1
    });
    return exists === 1;
  } catch (error) {
    logger.error('Highlight cache check failed', { 
      userId, 
      title, 
      error 
    });
    return false;
  }
}

export async function cacheHighlight(userId: string, title: string, highlight: any): Promise<void> {
  try {
    const key = `highlight:${userId}:${title}:${highlight.location}`;
    await redis.set(key, JSON.stringify(highlight), {
      ex: HIGHLIGHT_TTL
    });
    logger.debug('Highlight cached', { 
      userId, 
      title, 
      location: highlight.location 
    });
  } catch (error) {
    logger.error('Failed to cache highlight', { 
      userId, 
      title, 
      error 
    });
    throw error;
  }
}

// Book page caching
export async function getCachedBookPageId(userId: string, title: string): Promise<string | null> {
  try {
    const pageId = await redis.get<string>(`page_id:${userId}:${title}`);
    logger.debug('Retrieved cached book page ID', { 
      userId, 
      title,
      cached: !!pageId
    });
    return pageId;
  } catch (error) {
    logger.error('Failed to get cached book page ID', { 
      userId, 
      title, 
      error 
    });
    throw error;
  }
}

export async function cacheBookPageId(userId: string, title: string, pageId: string): Promise<void> {
  try {
    await redis.set(`page_id:${userId}:${title}`, pageId, {
      ex: PAGE_ID_TTL
    });
    logger.debug('Book page ID cached', { 
      userId, 
      title 
    });
  } catch (error) {
    logger.error('Failed to cache book page ID', { 
      userId, 
      title, 
      error 
    });
    throw error;
  }
}

// Book caching
export async function getCachedBook(userId: string, title: string): Promise<any> {
  try {
    const cached = await redis.get<string>(`book:${userId}:${title}`);
    if (typeof cached === 'string') {
      logger.debug('Retrieved cached book', { 
        userId, 
        title 
      });
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    logger.error('Failed to get cached book', { 
      userId, 
      title, 
      error 
    });
    throw error;
  }
}

export async function cacheBook(userId: string, book: any): Promise<void> {
  try {
    await redis.set(`book:${userId}:${book.title}`, JSON.stringify(book), {
      ex: BOOK_TTL
    });
    logger.debug('Book cached', { 
      userId, 
      title: book.title 
    });
  } catch (error) {
    logger.error('Failed to cache book', { 
      userId, 
      title: book.title, 
      error 
    });
    throw error;
  }
}

export async function invalidateBookCache(userId: string, title: string): Promise<void> {
  try {
    await redis.del(`book:${userId}:${title}`);
    logger.debug('Book cache invalidated', { 
      userId, 
      title 
    });
  } catch (error) {
    logger.error('Failed to invalidate book cache', { 
      userId, 
      title, 
      error 
    });
    throw error;
  }
}

// Cache clearing
export async function clearUserCaches(userId: string): Promise<void> {
  try {
    const keys = await redis.keys(`*:${userId}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug('Cleared user caches', { 
        userId, 
        keysCleared: keys.length 
      });
    }
  } catch (error) {
    logger.error('Failed to clear user caches', { 
      userId, 
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
    const metrics = await redis.mget(
      'stats:cache:hits',
      'stats:cache:misses',
      'stats:errors',
      'stats:operations'
    ) as string[];
    
    const hits = parseInt(metrics[0] ?? '0');
    const misses = parseInt(metrics[1] ?? '0');
    const errors = parseInt(metrics[2] ?? '0');
    const operations = parseInt(metrics[3] ?? '0');
    
    const hitRate = hits + misses > 0 ? hits / (hits + misses) : 0;
    
    return {
      cacheHitRate: hitRate,
      errorRate: errors / Math.max(operations, 1),
      operations
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
