import { Redis } from 'ioredis';
import { getRedis } from '../services/redisService';

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
  const maxRetries = options?.maxRetries || 3;
  const retryDelay = options?.retryDelay || 1000; // 1 second
  const timeout = options?.timeout || 5000; // 5 seconds

  let redis: Redis;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      redis = await getRedis();
      
      // Test connection with timeout
      const pingResponse = await Promise.race([
        redis.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), timeout)
        )
      ]);

      // Test basic operations
      const testKey = `test:${Date.now()}`;
      await redis.set(testKey, 'test-value', 'EX', 10); // Set with 10s expiration
      const testValue = await redis.get(testKey);
      await redis.del(testKey);

      if (testValue !== 'test-value') {
        throw new Error('Redis test operations failed');
      }

      return {
        success: true,
        pingResponse: pingResponse as string,
        testOperation: true,
        connectionTime: new Date().toISOString(),
        retryCount
      };
    } catch (error) {
      retryCount++;
      if (retryCount >= maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
    }
  }

  throw new Error('Redis connection failed after retries');
}