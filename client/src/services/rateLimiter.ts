interface RateLimitStatus {
  allowed: boolean;
  remainingTime: number;
  remainingUploads: number;
}

const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;

export class RateLimiter {
  private static instance: RateLimiter;
  private lastCheck: number = 0;
  private cachedStatus: RateLimitStatus | null = null;
  private cacheValidityMs = 30000; // Cache valid for 30 seconds

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  private shouldRefreshCache(): boolean {
    return (
      !this.cachedStatus ||
      Date.now() - this.lastCheck > this.cacheValidityMs
    );
  }

  async checkRateLimit(): Promise<RateLimitStatus> {
    if (!this.shouldRefreshCache()) {
      return this.cachedStatus!;
    }

    try {
      const response = await fetch(`${apiBase}/rate-limit-status`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to check rate limit status');
      }

      const status = await response.json();
      this.cachedStatus = status;
      this.lastCheck = Date.now();
      return status;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      throw error;
    }
  }

  async canSync(): Promise<{ allowed: boolean; message?: string }> {
    try {
      const status = await this.checkRateLimit();
      if (!status.allowed) {
        const remainingTime = Math.ceil(status.remainingTime / 60);
        return {
          allowed: false,
          message: `You have exceeded the upload limit of 2 uploads every 30 minutes. Please try again in ${remainingTime} minutes.`
        };
      }
      return { allowed: true };
    } catch (error) {
      return {
        allowed: false,
        message: 'Failed to check rate limit status'
      };
    }
  }
}

export const rateLimiter = RateLimiter.getInstance();