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

export async function checkRateLimit(): Promise<boolean> {
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const key = `rate_limit:${currentTime}`;
    
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

export async function getCachedBook(title: string): Promise<NotionBookPage | null> {
  try {
    const cached = await redisClient.get<string>(`book:${title}`);
    if (typeof cached === 'string') {
      return JSON.parse(cached) as NotionBookPage;
    }
    return null;
  } catch (error) {
    console.error('Failed to parse cached book:', error);
    return null;
  }
}

export async function cacheBook(book: NotionBookPage): Promise<void> {
  await redisClient.set(`book:${book.title}`, JSON.stringify(book), {
    ex: BOOK_TTL
  });
}

export async function invalidateBookCache(title: string): Promise<void> {
  await redisClient.del(`book:${title}`);
}

export async function isHighlightCached(title: string, highlight: Highlight): Promise<boolean> {
  const key = `highlight:${title}:${highlight.location}`;
  return (await redisClient.exists(key)) === 1;
}

export async function cacheHighlight(title: string, highlight: Highlight): Promise<void> {
  const key = `highlight:${title}:${highlight.location}`;
  await redisClient.set(key, JSON.stringify(highlight), {
    ex: HIGHLIGHT_TTL
  });
}

export async function getCachedBookPageId(title: string): Promise<string | null> {
  return await redisClient.get(`page_id:${title}`);
}

export async function cacheBookPageId(title: string, pageId: string): Promise<void> {
  await redisClient.set(`page_id:${title}`, pageId, {
    ex: PAGE_ID_TTL
  });
}

export async function clearAllCaches(): Promise<void> {
  const keys = await redisClient.keys('*');
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
}
