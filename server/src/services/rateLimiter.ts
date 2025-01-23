import { InMemoryStore } from './inMemoryStore.js';

interface RateLimitCheck {
  allowed: boolean;
  remainingTime: number;
  remainingUploads: number;
}

class RateLimiter {
  private store: InMemoryStore;
  private limit: number;
  private windowMs: number;

  constructor(limit = 2, windowMs = 30 * 60 * 1000) {
    this.store = new InMemoryStore();
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(ip: string): RateLimitCheck {
    const now = Date.now();
    const record = this.store.get(ip) || { count: 0, startTime: now };

    // Reset if window has passed
    if (now - record.startTime > this.windowMs) {
      record.count = 0;
      record.startTime = now;
    }

    const remainingTime = Math.ceil(
      (this.windowMs - (now - record.startTime)) / 1000 / 60
    );
    const remainingUploads = this.limit - record.count;

    return {
      allowed: record.count < this.limit,
      remainingTime,
      remainingUploads
    };
  }

  increment(ip: string): void {
    const record = this.store.get(ip) || { count: 0, startTime: Date.now() };
    record.count += 1;
    this.store.set(ip, record);
  }

  trackGitHubUpload(ip: string): void {
    this.increment(ip);
  }
}

export const rateLimiter = new RateLimiter();
