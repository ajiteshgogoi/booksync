import { logger } from '../utils/logger.js';
import { processFile } from './processService.js';
import { queueService } from './queueService.js';
import { jobStateService } from './jobStateService.js';
import { downloadObject } from './r2Service.js';

const POLL_INTERVAL = 1000; // 1 second between polls
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class WorkerService {
  private isRunning: boolean = false;
  private shouldContinue: boolean = false;
  private currentJobId: string | null = null;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.debug('Worker already running');
      return;
    }

    this.isRunning = true;
    
    try {
      logger.info('Starting worker service');
      await this.runWorkerCycle();
    } catch (error) {
      logger.error('Error in worker cycle', error);
    } finally {
      this.isRunning = false;
      logger.info('Worker service completed');
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping worker service');
    this.shouldContinue = false;
    this.isRunning = false;
    
    if (this.currentJobId) {
      logger.info('Worker stopped while processing job', { jobId: this.currentJobId });
    }

    // Ensure we wait for any ongoing operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async runWorkerCycle(): Promise<void> {
    try {
      logger.info('Starting worker cycle');
      
      // Poll for available jobs from the queue
      let pollCount = 0;
      while (pollCount < 10) {
        if (!this.isRunning) {
          logger.info('Worker cycle stopped before completion');
          return;
        }

        pollCount++;
        logger.info(`Starting poll ${pollCount} of max 10`);
        
        // Enforce poll interval at the start of each iteration
        if (pollCount > 1) {
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        }

        try {
          // Try to get next job from queue
          const nextInQueue = await queueService.moveToActive();
          
          if (!nextInQueue) {
            logger.info(`No jobs found in poll ${pollCount}`);
            continue;
          }
          
          const { uploadId, userId } = nextInQueue;

          // sync: prefix means job is ready to process
          this.currentJobId = uploadId;
          logger.info('Processing job from queue', { jobId: uploadId, userId });

          // Update job state to processing
          await jobStateService.updateJobState(uploadId, {
            state: 'processing',
            message: 'Starting file processing'
          });

          try {
            // Process the file
            await processFile(uploadId);

            // Update job state to completed
            await jobStateService.updateJobState(uploadId, {
              state: 'completed',
              message: 'File processing completed',
              completedAt: Date.now()
            });

            // Remove from active users
            await queueService.removeFromActive(userId);
            
            logger.info('Job processed successfully, stopping cycle');
            break;

          } catch (error: any) {
            // Handle job processing error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await jobStateService.updateJobState(uploadId, {
              state: 'failed',
              message: `File processing failed: ${errorMessage}`,
              errorDetails: errorMessage
            });

            // Remove from active users on failure
            await queueService.removeFromActive(userId);
            
            logger.error('Job processing failed', { uploadId, error });
            break;
          }

        } catch (error) {
          logger.error('Error in worker loop', error);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      logger.error('Error in worker cycle', error);
      throw error;
    } finally {
      logger.info('Worker cycle completed');
      this.currentJobId = null;
      this.isRunning = false;
    }
  }
}

// Create singleton instance
export const workerService = new WorkerService();