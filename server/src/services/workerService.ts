import { logger } from '../utils/logger.js';
import {
  getRedis,
  initializeStream,
  getNextJob,
  setJobStatus,
  acknowledgeJob,
  RedisService
} from './redisService.js';
import { processFile } from './processService.js';
import type { JobStatus } from './redisService.js';

// Maximum number of empty polls before exiting
const MAX_EMPTY_POLLS = 10; // Will exit after ~10 seconds of no jobs
const POLL_INTERVAL = 1000; // 1 second between polls

class WorkerService {
  private isRunning: boolean = false;
  private currentJobId: string | null = null;
  private emptyPollCount: number = 0;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting worker service');

    try {
      // Initialize Redis stream and consumer group
      await initializeStream();

      // Start processing loop
      while (this.isRunning) {
        try {
          const result = await getNextJob();
          
          if (!result) {
            this.emptyPollCount++;
            if (this.emptyPollCount >= MAX_EMPTY_POLLS) {
              logger.info(`No jobs found after ${MAX_EMPTY_POLLS} attempts, stopping worker`);
              this.isRunning = false;
              break;
            }
            // No jobs available, wait before checking again
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }
          
          // Reset empty poll count when job is found
          this.emptyPollCount = 0;
          const { jobId, messageId } = result;
          this.currentJobId = jobId;

          // Update job status to processing
          await setJobStatus(jobId, { 
            state: 'processing',
            message: 'Starting file processing'
          });

          try {
            // Process the job
            await processFile(jobId);

            // Update job status to completed
            await setJobStatus(jobId, {
              state: 'completed',
              message: 'File processing completed',
              completedAt: Date.now()
            });

          } catch (error) {
            // Handle job processing error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await setJobStatus(jobId, {
              state: 'failed',
              message: `File processing failed: ${errorMessage}`
            });
            logger.error('Job processing failed', { jobId, error });
          }

          // Acknowledge message after processing (whether successful or failed)
          await acknowledgeJob(messageId);
          this.currentJobId = null;

        } catch (error) {
          logger.error('Error in worker loop', error);
          // Wait before retrying on error
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      logger.error('Fatal error in worker service', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping worker service');
    this.isRunning = false;
    this.emptyPollCount = 0;
    
    // Log worker exit reason
    if (this.currentJobId) {
      logger.info('Worker stopped while processing job', { jobId: this.currentJobId });
    }
    
    // Clean up Redis connections
    try {
      await RedisService.cleanup();
      logger.info('Successfully cleaned up Redis connections');
    } catch (error) {
      logger.error('Error cleaning up Redis connections', { error });
    }
  }

  getCurrentJob(): string | null {
    return this.currentJobId;
  }
}

// Create singleton instance
const workerService = new WorkerService();
export default workerService;