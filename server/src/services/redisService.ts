import { Redis } from '@upstash/redis';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Queue configuration
export const QUEUE_NAME = 'sync_jobs';
export const JOB_TTL = 60 * 60 * 24; // 24 hours

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX = 10; // Max requests per window

// Cache TTLs
const BOOK_TTL = 60 * 60 * 24; // 24 hours
const HIGHLIGHT_TTL = 60 * 60 * 24 * 7; // 1 week
const PAGE_ID_TTL = 60 * 60 * 24; // 24 hours

// Queue functions
export async function addJobToQueue(jobId: string): Promise<void> {
  await redis.rpush(QUEUE_NAME, jobId);
}

export async function getNextJob(): Promise<string | null> {
  return await redis.lpop(QUEUE_NAME);
}

export async function getJobStatus(jobId: string): Promise<any> {
  return await redis.get(`job:${jobId}`);
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
    
    return requests <= RATE_LIMIT_MAX;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Fail open to avoid blocking requests
  }
}

// Highlight caching
export async function isHighlightCached(userId: string, title: string, highlight: any): Promise<boolean> {
  const key = `highlight:${userId}:${title}:${highlight.location}`;
  return (await redis.exists(key)) === 1;
}

export async function cacheHighlight(userId: string, title: string, highlight: any): Promise<void> {
  const key = `highlight:${userId}:${title}:${highlight.location}`;
  await redis.set(key, JSON.stringify(highlight), {
    ex: HIGHLIGHT_TTL
  });
}

// Book page caching
export async function getCachedBookPageId(userId: string, title: string): Promise<string | null> {
  return await redis.get(`page_id:${userId}:${title}`);
}

export async function cacheBookPageId(userId: string, title: string, pageId: string): Promise<void> {
  await redis.set(`page_id:${userId}:${title}`, pageId, {
    ex: PAGE_ID_TTL
  });
}

// Book caching
export async function getCachedBook(userId: string, title: string): Promise<any> {
  const cached = await redis.get<string>(`book:${userId}:${title}`);
  if (typeof cached === 'string') {
    return JSON.parse(cached);
  }
  return null;
}

export async function cacheBook(userId: string, book: any): Promise<void> {
  await redis.set(`book:${userId}:${book.title}`, JSON.stringify(book), {
    ex: BOOK_TTL
  });
}

export async function invalidateBookCache(userId: string, title: string): Promise<void> {
  await redis.del(`book:${userId}:${title}`);
}

// Cache clearing
export async function clearUserCaches(userId: string): Promise<void> {
  const keys = await redis.keys(`*:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
