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

      if (remainingUploads < this.limit) {
        console.log(`[RateLimiter] ${remainingUploads} uploads remaining. Reset in ${remainingTime} minutes`);
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
        record.count = 1;
        console.log(`[RateLimiter] ${this.limit - 1} uploads remaining in window`);
      } else {
        record.count += 1;
        console.log(`[RateLimiter] ${this.limit - record.count} uploads remaining in window`);
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
