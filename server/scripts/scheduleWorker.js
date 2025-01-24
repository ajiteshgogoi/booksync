#!/usr/bin/env node
import { WorkerService } from '../src/services/workerService.js';
import { logger } from '../src/utils/logger.js';
import { redisPool } from '../src/services/redisService.js';

const WORKER_INTERVAL = 30000; // 30 seconds

async function runWorker() {
  const workerService = new WorkerService();
  try {
    await workerService.start();
  } catch (error) {
    logger.error('Worker run failed', error);
  } finally {
    // Clean up Redis connections after each run
    try {
      await redisPool.cleanup();
      logger.info('Redis connections cleaned up');
    } catch (error) {
      logger.error('Error cleaning up Redis connections', error);
    }
  }
}

(async () => {
  logger.info('Starting worker scheduler');
  
  // Run immediately and then schedule
  await runWorker();
  
  const interval = setInterval(async () => {
    try {
      await runWorker();
    } catch (error) {
      logger.error('Scheduled worker run failed', error);
    }
  }, WORKER_INTERVAL);

  // Handle shutdown
  process.on('SIGTERM', async () => {
    clearInterval(interval);
    try {
      await redisPool.cleanup();
      logger.info('Redis connections cleaned up during shutdown');
    } catch (error) {
      logger.error('Error during Redis cleanup on shutdown', error);
    }
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    clearInterval(interval);
    try {
      await redisPool.cleanup();
      logger.info('Redis connections cleaned up during shutdown');
    } catch (error) {
      logger.error('Error during Redis cleanup on shutdown', error);
    }
    process.exit(0);
  });
})();