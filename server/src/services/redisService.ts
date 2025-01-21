import { Redis } from '@upstash/redis';
import { Highlight, NotionBookPage } from './notionClient';

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60; // 60 seconds
const RATE_LIMIT_MAX = 10; // Max requests per window

// Cache TTLs
const BOOK_TTL = 60 * 60 * 24; // 24 hours
const HIGHLIGHT_TTL = 60 * 60 * 24 * 7; // 1 week
const PAGE_ID_TTL = 60 * 60 * 24; // 24 hours

export async function checkRateLimit(userId: string): Promise<boolean> {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const key = `rate_limit:${userId}:${currentTime}`;
    
    const requests = await redisClient.incr(key);
    if (requests === 1) {
      await redisClient.expire(key, RATE_LIMIT_WINDOW);
    }
    
    return requests <= RATE_LIMIT_MAX;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return true; // Fail open to avoid blocking requests
  }
}

export async function getCachedBook(userId: string, title: string): Promise<NotionBookPage | null> {
  try {
    const cached = await redisClient.get<string>(`book:${userId}:${title}`);
    if (typeof cached === 'string') {
      return JSON.parse(cached) as NotionBookPage;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse cached book:', error);
    return null;
  }
}

export async function cacheBook(userId: string, book: NotionBookPage): Promise<void> {
  await redisClient.set(`book:${userId}:${book.title}`, JSON.stringify(book), {
    ex: BOOK_TTL
  });
}

export async function invalidateBookCache(userId: string, title: string): Promise<void> {
  await redisClient.del(`book:${userId}:${title}`);
}

export async function isHighlightCached(userId: string, title: string, highlight: Highlight): Promise<boolean> {
  const key = `highlight:${userId}:${title}:${highlight.location}`;
  return (await redisClient.exists(key)) === 1;
}

export async function cacheHighlight(userId: string, title: string, highlight: Highlight): Promise<void> {
  const key = `highlight:${userId}:${title}:${highlight.location}`;
  await redisClient.set(key, JSON.stringify(highlight), {
    ex: HIGHLIGHT_TTL
  });
}

export async function getCachedBookPageId(userId: string, title: string): Promise<string | null> {
  return await redisClient.get(`page_id:${userId}:${title}`);
}

export async function cacheBookPageId(userId: string, title: string, pageId: string): Promise<void> {
  await redisClient.set(`page_id:${userId}:${title}`, pageId, {
    ex: PAGE_ID_TTL
  });
}

export async function clearUserCaches(userId: string): Promise<void> {
  const keys = await redisClient.keys(`*:${userId}:*`);
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
}
