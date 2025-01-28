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
          // Check next job in queue
          const nextInQueue = await queueService.getNextJob();
          
          if (!nextInQueue) {
            logger.info(`No jobs found in poll ${pollCount}`);
            continue;
          }
          
          const { uploadId, userId } = nextInQueue;

          // sync: prefix means job is ready to process
          this.currentJobId = uploadId;
          logger.info('Processing job from queue', { jobId: uploadId, userId });

          // Verify job exists before processing
          const jobExists = await jobStateService.getJobState(uploadId);
          if (!jobExists) {
            logger.error('Job not found in job state service', { uploadId });
            throw new Error('Job not found - ensure job is created before processing');
          }

          // Get current job state after job is active
          const jobState = await jobStateService.getJobState(uploadId);
          if (!jobState) {
            logger.error('Job not found in job state service', { uploadId });
            throw new Error('Job not found');
          }

          // If job isn't parsed yet, skip processing but keep in active state
          if (jobState.state !== 'parsed') {
            logger.debug('Job not in parsed state yet, will try again next poll', {
              uploadId,
              currentState: jobState.state
            });
            continue;
          }

          try {
            // Process the file - let it handle state transitions
            await processFile(uploadId);
            logger.info('Job processed successfully');
          } catch (error: any) {
            // Handle job processing error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await jobStateService.updateJobState(uploadId, {
              state: 'failed',
              message: `File processing failed: ${errorMessage}`,
              errorDetails: errorMessage
            });
            
            logger.error('Job processing failed', { uploadId, error });
            throw error;

          } finally {
            try {
              // Remove job from queue and check if we should remove from active users
              await queueService.removeFromQueue(uploadId);
              await queueService.removeFromActive(userId);
              logger.debug('Cleaned up job after processing', { userId, uploadId });
            } catch (cleanupError) {
              logger.error('Error removing job from active queue', {
                userId,
                uploadId,
                error: cleanupError
              });
            }
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