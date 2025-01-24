import { InMemoryStore } from './inMemoryStore.js';

function maskIP(ip: string): string {
  // For IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return `${parts[0]}.${parts[1]}.*.*`;
  }
  // For IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts[0]}:${parts[1]}:****:****`;
  }
  return 'unknown';
}

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

  constructor(limit = 2, windowMs = 60 * 60 * 1000, cleanupInterval = 60 * 60 * 1000) {
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
      const allRecords = this.store.getAll();
      const totalRecords = Object.keys(allRecords).length;
      
      for (const [ip, record] of Object.entries(allRecords)) {
        const typedRecord = record as RateLimitRecord;
        const timeSinceUpdate = now - typedRecord.lastUpdated;
        
        if (timeSinceUpdate > this.windowMs) {
          this.store.delete(ip);
          cleanedCount++;
          console.log(
            `[RateLimiter] Cleaned record for ${maskIP(ip)}:`,
            JSON.stringify({
              event: 'cleanup',
              lastUpdated: new Date(typedRecord.lastUpdated).toISOString(),
              idleTime: `${Math.floor(timeSinceUpdate / 60000)}m`,
              count: typedRecord.count
            })
          );
        }
      }

      if (cleanedCount > 0 || totalRecords > 0) {
        console.log(
          '[RateLimiter] Cleanup summary:',
          JSON.stringify({
            event: 'cleanup_summary',
            cleanedCount,
            remainingRecords: totalRecords - cleanedCount,
            totalRecords,
            cleanupTime: new Date().toISOString()
          })
        );
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
        console.log(
          `[RateLimiter] Reset window for ${maskIP(ip)}:`,
          JSON.stringify({
            event: 'window_reset',
            newCount: record.count,
            windowStartTime: new Date(now).toISOString()
          })
        );
      }

      const remainingTime = Math.max(
        0,
        Math.ceil((this.windowMs - (now - record.startTime)) / 1000)
      );
      const remainingUploads = Math.max(0, this.limit - record.count);
      const allowed = record.count < this.limit;

      // Enhanced logging with rate limit decision details
      console.log(
        `[RateLimiter] Check for ${maskIP(ip)}:`,
        JSON.stringify({
          decision: allowed ? 'allowed' : 'blocked',
          currentCount: record.count,
          limit: this.limit,
          remainingUploads,
          windowTimeLeft: `${Math.floor(remainingTime / 60)}m ${remainingTime % 60}s`,
          windowStarted: new Date(record.startTime).toISOString()
        })
      );

      return {
        allowed,
        remainingTime,
        remainingUploads
      };
    } catch (error) {
      console.error('[RateLimiter] Error checking rate limit:', error);
      // Return conservative values in case of error
      return {
        allowed: false,
        remainingTime: this.windowMs / 1000,
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

      // If window has passed, reset count
      const isNewWindow = now - record.startTime > this.windowMs;
      if (isNewWindow) {
        record.count = 1;
        record.startTime = now;
        console.log(
          `[RateLimiter] New window started for ${maskIP(ip)}:`,
          JSON.stringify({
            event: 'window_reset',
            newCount: record.count,
            limit: this.limit,
            windowStartTime: new Date(now).toISOString(),
            previousWindowStart: new Date(record.startTime).toISOString()
          })
        );
      } else {
        record.count += 1;
      }
      
      record.lastUpdated = now;
      this.store.set(ip, record);
      
      const remainingUploads = this.limit - record.count;
      const windowEndTime = new Date(record.startTime + this.windowMs);
      console.log(
        `[RateLimiter] Increment for ${maskIP(ip)}:`,
        JSON.stringify({
          event: 'increment',
          currentCount: record.count,
          remainingUploads,
          limit: this.limit,
          windowEnds: windowEndTime.toISOString(),
          timeUntilReset: `${Math.floor((windowEndTime.getTime() - now) / 60000)}m`,
          isNewWindow
        })
      );
    } catch (error) {
      console.error('[RateLimiter] Error incrementing count:', error);
      throw error;
    }
  }
}

export const rateLimiter = new RateLimiter();