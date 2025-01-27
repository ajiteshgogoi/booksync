import { logger } from './utils/logger.js';
import { jobCleanupService } from './services/jobCleanupService.js';
import { workerService } from './services/workerService.js';
import { devWorkerService } from './services/devWorkerService.js';
import { CleanupService } from './services/cleanupService.js';

let isWorkerRunning = false;

export async function startWorker(): Promise<void> {
  if (isWorkerRunning) {
    logger.debug('Worker already running');
    return;
  }

  isWorkerRunning = true;

  try {
    logger.info('Starting worker process');
    
    // Run cleanup service first
    await CleanupService.cleanup();
    logger.info('Cleanup service completed');
    
    // Use devWorkerService in development mode, workerService in production
    const service = process.env.NODE_ENV === 'development' ? devWorkerService : workerService;
    logger.info(`Using ${process.env.NODE_ENV === 'development' ? 'development' : 'production'} worker service`);
    
    // Start the appropriate worker service
    await service.start();
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
    const service = process.env.NODE_ENV === 'development' ? devWorkerService : workerService;
    await service.stop();
  } catch (error) {
    logger.error('Error stopping worker', error);
  } finally {
    isWorkerRunning = false;
  }
}

export function isWorkerActive(): boolean {
  return isWorkerRunning;
}
