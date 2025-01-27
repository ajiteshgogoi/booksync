import { logger } from '../utils/logger.js';
import { jobStateService } from './jobStateService.js';
import { tempStorageService } from './tempStorageService.js';

const TEMP_FILE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export class StorageCleanupService {
  private static instance: StorageCleanupService;
  private isRunning: boolean = false;

  private constructor() {}

  static getInstance(): StorageCleanupService {
    if (!StorageCleanupService.instance) {
      StorageCleanupService.instance = new StorageCleanupService();
    }
    return StorageCleanupService.instance;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info('Cleanup service already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting storage cleanup service');

    while (this.isRunning) {
      try {
        await this.runCleanupCycle();
      } catch (error) {
        logger.error('Error in cleanup cycle:', error);
      }

      // Wait for 1 hour before next cleanup cycle
      await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping storage cleanup service');
    this.isRunning = false;
  }

  private async runCleanupCycle(): Promise<void> {
    logger.info('Starting cleanup cycle');

    try {
      // Get all jobs
      const jobs = await jobStateService.listPendingJobs();
      const now = Date.now();

      for (const job of jobs) {
        try {
          // Check if job is in terminal state
          if (jobStateService.isTerminalState(job.state)) {
            // Check if job is older than TTL
            if (job.updatedAt < now - TEMP_FILE_TTL) {
              logger.info('Cleaning up old job files', {
                jobId: job.jobId,
                state: job.state,
                age: Math.round((now - job.updatedAt) / (60 * 60 * 1000)) + ' hours'
              });

              // Clean up temp files
              await tempStorageService.cleanupJob(job.jobId);

              // Delete job metadata if job is completed
              if (job.state === 'completed') {
                await jobStateService.deleteJob(job.jobId);
              }
            }
          }
        } catch (error) {
          logger.error('Error cleaning up job:', { jobId: job.jobId, error });
          continue;
        }
      }

      logger.info('Cleanup cycle completed');
    } catch (error) {
      logger.error('Error in cleanup cycle:', error);
      throw error;
    }
  }

  async cleanupJob(jobId: string): Promise<void> {
    try {
      const job = await jobStateService.getJobState(jobId);
      if (!job) {
        logger.warn('Job not found for cleanup', { jobId });
        return;
      }

      await tempStorageService.cleanupJob(jobId);

      if (job.state === 'completed') {
        await jobStateService.deleteJob(jobId);
      }

      logger.info('Manual job cleanup completed', { jobId });
    } catch (error) {
      logger.error('Error in manual job cleanup:', { jobId, error });
      throw error;
    }
  }
}

export const storageCleanupService = StorageCleanupService.getInstance();