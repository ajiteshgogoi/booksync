import { Redis } from 'ioredis';
import { getRedis } from '../services/redisService.js';

interface RedisConnectionOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

interface RedisTestResult {
  success: boolean;
  pingResponse: string;
  testOperation: boolean;
  connectionTime: string;
  retryCount: number;
}

/**
 * Verifies Redis connection with retry logic and basic operation testing
 */
export async function verifyRedisConnection(
  options?: RedisConnectionOptions
): Promise<RedisTestResult> {
  const maxRetries = options?.maxRetries || (process.env.VERCEL ? 2 : 3);
  const retryDelay = options?.retryDelay || (process.env.VERCEL ? 2000 : 1000);
  const timeout = options?.timeout || (process.env.VERCEL ? 10000 : 5000);

  let redis: Redis | undefined;
  let retryCount = 0;
  let result: RedisTestResult;

  while (retryCount < maxRetries) {
    try {
      redis = await getRedis();
      console.log('[Redis] Verifying connection, attempt:', retryCount + 1);
      
      // Quick ping test with short timeout
      const pingResponse = await Promise.race([
        redis.ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout')), 3000)
        )
      ]);

      console.log('[Redis] Connection verified successfully');
      return {
        success: true,
        pingResponse: pingResponse as string,
        testOperation: true,
        connectionTime: new Date().toISOString(),
        retryCount
      };
    } catch (error) {
      console.error('[Redis] Verification attempt failed:', {
        attempt: retryCount + 1,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      retryCount++;
      if (retryCount >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const backoffTime = retryDelay * Math.pow(2, retryCount - 1);
      console.log(`[Redis] Retrying in ${backoffTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    } finally {
      if (redis) {
        try {
          const redisPool = (await import('../services/redisService.js')).redisPool;
          redisPool.release(redis);
        } catch (error) {
          console.warn('[Redis] Error releasing connection:', error);
        }
      }
    }
  }

  throw new Error('Redis connection failed after retries');
}