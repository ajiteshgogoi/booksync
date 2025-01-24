#!/usr/bin/env node
import { startWorker, stopWorker } from '../src/worker.js';
import { logger } from '../src/utils/logger.js';

(async () => {
  try {
    logger.info('Starting worker script');
    await startWorker();
  } catch (error) {
    logger.error('Worker script error', error);
  } finally {
    logger.info('Stopping worker script');
    await stopWorker();
    process.exit(0);
  }
})();