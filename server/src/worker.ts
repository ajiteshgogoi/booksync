import { logger } from './utils/logger.js';
import workerService from './services/workerService.js';
import { RedisPool } from './services/redisService.js';

let isWorkerRunning = false;

export async function startWorker(): Promise<void> {
  if (isWorkerRunning) {
    logger.debug('Worker already running');
    return;
  }

  isWorkerRunning = true;

  try {
    logger.info('Starting worker process');
    await workerService.start();
  } catch (error) {
    logger.error('Worker process error', error);
  } finally {
    isWorkerRunning = false;
  }
}

export async function stopWorker(): Promise<void> {
  if (!isWorkerRunning) {
    return;
  }

  try {
    logger.info('Stopping worker process');
    await workerService.stop();
  } catch (error) {
    logger.error('Error stopping worker', error);
  } finally {
    isWorkerRunning = false;
  }
}

export function isWorkerActive(): boolean {
  return isWorkerRunning;
}

export function getCurrentJob(): string | null {
  return workerService.getCurrentJob();
}
