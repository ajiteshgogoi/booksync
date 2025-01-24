import { redisPool } from './build/src/services/redisService.js';
import { logger } from './build/src/utils/logger.js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/dev/github/booksync/server/.env' });

async function resetRedis() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      logger.info('Starting Redis reset attempt', { attempt: retryCount + 1 });

      // Cleanup existing connections
      logger.info('Cleaning up Redis connections');
      await redisPool.cleanup();

      // Wait for connections to fully close
      logger.info('Waiting for connections to close');
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

      // Reset pool
      logger.info('Resetting Redis pool');
      await redisPool.reset();

      // Verify connection
      const redis = await redisPool.acquire();
      try {
        await redis.ping();
        logger.info('Redis connection verified');
      } finally {
        redisPool.release(redis);
      }

      logger.info('Redis reset completed successfully');
      process.exit(0);
    } catch (error) {
      retryCount++;
      logger.error('Error during Redis reset', {
        attempt: retryCount,
        error: error.message,
        stack: error.stack
      });

      if (retryCount < MAX_RETRIES) {
        logger.info(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        logger.error('Max retries reached, giving up');
        process.exit(1);
      }
    }
  }
}

resetRedis();
