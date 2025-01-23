import { InMemoryStore } from './inMemoryStore.js';

interface RateLimitRecord {
  count: number;
  startTime: number;
  lastUpdated: number;
}

interface RateLimitCheck {
  allowed: boolean;
  remainingTime: number;
  remainingUploads: number;
}

class RateLimiter {
  private store: InMemoryStore;
  private limit: number;
  private windowMs: number;
  private cleanupInterval: number;

  constructor(limit = 2, windowMs = 30 * 60 * 1000, cleanupInterval = 60 * 60 * 1000) {
    this.store = new InMemoryStore();
    this.limit = limit;
    this.windowMs = windowMs;
    this.cleanupInterval = cleanupInterval;

    console.log(`[RateLimiter] Initialized with limit: ${limit}, window: ${windowMs/1000}s`);

    // Start cleanup interval
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    try {
      for (const [ip, record] of Object.entries(this.store.getAll())) {
        if (now - (record as RateLimitRecord).lastUpdated > this.windowMs) {
          this.store.delete(ip);
          cleanedCount++;
        }
      }
      if (cleanedCount > 0) {
        console.log(`[RateLimiter] Cleaned up ${cleanedCount} expired records`);
      }
    } catch (error) {
      console.error('[RateLimiter] Error during cleanup:', error);
    }
  }

  check(ip: string): RateLimitCheck {
    try {
      const now = Date.now();
      const record = this.store.get(ip) as RateLimitRecord || { 
        count: 0, 
        startTime: now,
        lastUpdated: now 
      };

      // If window has passed, reset the count
      if (now - record.startTime > this.windowMs) {
        record.count = 0;
        record.startTime = now;
        record.lastUpdated = now;
        this.store.set(ip, record);
        console.log(`[RateLimiter] Reset window for IP: ${ip}`);
      }

      const remainingTime = Math.max(
        0,
        Math.ceil((this.windowMs - (now - record.startTime)) / 1000 / 60)
      );
      const remainingUploads = Math.max(0, this.limit - record.count);

      // Log if remaining uploads are low or rate limit is exceeded
      if (remainingUploads === 0) {
        console.warn(`[RateLimiter] Rate limit exceeded for IP: ${ip}. Try again in ${remainingTime} minutes`);
      } else if (remainingUploads === 1) {
        console.warn(`[RateLimiter] IP: ${ip} has 1 upload remaining in window`);
      }

      return {
        allowed: record.count < this.limit,
        remainingTime,
        remainingUploads
      };
    } catch (error) {
      console.error('[RateLimiter] Error checking rate limit:', error);
      // Return conservative values in case of error
      return {
        allowed: false,
        remainingTime: this.windowMs / 1000 / 60,
        remainingUploads: 0
      };
    }
  }

  increment(ip: string): void {
    try {
      const now = Date.now();
      const record = this.store.get(ip) as RateLimitRecord || { 
        count: 0, 
        startTime: now,
        lastUpdated: now 
      };

      // Atomic update
      if (now - record.startTime > this.windowMs) {
        record.count = 1;
        record.startTime = now;
        console.log(`[RateLimiter] New upload window started for IP: ${ip}`);
      } else {
        record.count += 1;
        console.log(`[RateLimiter] Increment for IP: ${ip}, count: ${record.count}/${this.limit}`);
      }
      record.lastUpdated = now;
      this.store.set(ip, record);
    } catch (error) {
      console.error('[RateLimiter] Error incrementing count:', error);
      throw error; // Re-throw to handle at higher level
    }
  }

  trackGitHubUpload(ip: string): void {
    this.increment(ip);
  }
}

export const rateLimiter = new RateLimiter();
