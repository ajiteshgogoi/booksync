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
      
      // Poll for available jobs from the queue (reduced from 10 to 5 to optimize R2 operations)
      let pollCount = 0;
      while (pollCount < 5) {
        if (!this.isRunning) {
          logger.info('Worker cycle stopped before completion');
          return;
        }

        pollCount++;
        logger.info(`Starting poll ${pollCount} of max 5`);
        
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

          // Verify job exists and get its state
          const jobState = await jobStateService.getJobState(uploadId);
          if (!jobState) {
            logger.error('Job not found in job state service', { uploadId });
            throw new Error('Job not found - ensure job is created before processing');
          }

          // For chunk jobs, verify parent upload still exists
          if (jobState.isChunk && jobState.parentUploadId) {
            const parentStatus = await jobStateService.getChunkedUploadStatus(jobState.parentUploadId);
            if (parentStatus.isComplete) {
              logger.info('Parent upload already complete, skipping chunk', {
                jobId: uploadId,
                parentUploadId: jobState.parentUploadId
              });
              continue;
            }
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

            // For chunk jobs, check if all chunks are complete
            const jobState = await jobStateService.getJobState(uploadId);
            if (jobState?.isChunk && jobState.parentUploadId) {
              const uploadStatus = await jobStateService.getChunkedUploadStatus(jobState.parentUploadId);
              logger.info('Chunk status updated', {
                jobId: uploadId,
                parentUploadId: jobState.parentUploadId,
                uploadStatus
              });

              if (uploadStatus.isComplete) {
                if (uploadStatus.allSuccessful) {
                  logger.info('All chunks completed successfully', {
                    parentUploadId: jobState.parentUploadId
                  });
                } else {
                  logger.warn('Chunked upload completed with failures', {
                    parentUploadId: jobState.parentUploadId,
                    failedChunks: uploadStatus.failedChunks
                  });
                }
              }
            }
          } catch (error: any) {
            // Handle job processing error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await jobStateService.updateJobState(uploadId, {
              state: 'failed',
              message: `File processing failed: ${errorMessage}`,
              errorDetails: errorMessage
            });
            
            const jobState = await jobStateService.getJobState(uploadId);
            if (jobState?.isChunk && jobState.parentUploadId) {
              logger.error('Chunk processing failed', {
                jobId: uploadId,
                parentUploadId: jobState.parentUploadId,
                error
              });
            } else {
              logger.error('Job processing failed', { uploadId, error });
            }
            throw error;

          } finally {
            try {
              // Remove job from queue and check if we should remove from active users
              await queueService.removeFromQueue(uploadId);
              
              // For chunk jobs, only remove from active users if all chunks are done
              const jobState = await jobStateService.getJobState(uploadId);
              if (jobState?.isChunk && jobState.parentUploadId) {
                const uploadStatus = await jobStateService.getChunkedUploadStatus(jobState.parentUploadId);
                if (uploadStatus.isComplete) {
                  await queueService.removeFromActive(userId);
                  logger.debug('Removed user from active after all chunks complete', {
                    userId,
                    parentUploadId: jobState.parentUploadId
                  });
                }
              } else {
                await queueService.removeFromActive(userId);
                logger.debug('Cleaned up job after processing', { userId, uploadId });
              }
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