import { redisPool } from './build/src/services/redisService.js';
import { logger } from './build/src/utils/logger.js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/dev/github/booksync/server/.env' });

async function resetRedis() {
  try {
    logger.info('Force disconnecting all Redis connections');
    await redisPool.cleanup();
    logger.info('Redis connections successfully disconnected');
    process.exit(0);
  } catch (error) {
    logger.error('Error during Redis reset', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

resetRedis();
