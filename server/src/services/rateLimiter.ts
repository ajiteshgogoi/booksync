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
    for (const [ip, record] of Object.entries(this.store.getAll())) {
      if (now - (record as RateLimitRecord).lastUpdated > this.windowMs) {
        this.store.delete(ip);
      }
    }
  }

  check(ip: string): RateLimitCheck {
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
    }

    const remainingTime = Math.max(
      0,
      Math.ceil((this.windowMs - (now - record.startTime)) / 1000 / 60)
    );
    const remainingUploads = Math.max(0, this.limit - record.count);

    return {
      allowed: record.count < this.limit,
      remainingTime,
      remainingUploads
    };
  }

  increment(ip: string): void {
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
    } else {
      record.count += 1;
    }
    record.lastUpdated = now;
    this.store.set(ip, record);
  }

  trackGitHubUpload(ip: string): void {
    this.increment(ip);
  }
}

export const rateLimiter = new RateLimiter();
