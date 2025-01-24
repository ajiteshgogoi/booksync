#!/usr/bin/env node
import { WorkerService } from '../src/services/workerService.js';
import { logger } from '../src/utils/logger.js';

const WORKER_INTERVAL = 30000; // 30 seconds

(async () => {
  logger.info('Starting worker scheduler');
  
  const workerService = new WorkerService();
  
  // Run immediately and then schedule
  await workerService.start();
  
  const interval = setInterval(async () => {
    try {
      await workerService.start();
    } catch (error) {
      logger.error('Scheduled worker run failed', error);
    }
  }, WORKER_INTERVAL);

  // Handle shutdown
  process.on('SIGTERM', () => {
    clearInterval(interval);
    workerService.stop().finally(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    clearInterval(interval);
    workerService.stop().finally(() => process.exit(0));
  });
})();