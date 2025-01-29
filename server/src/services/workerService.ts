import { logger } from '../utils/logger.js';
import { processFile } from './processService.js';
import { queueService } from './queueService.js';
import { jobStateService } from './jobStateService.js';
import { downloadObject } from './r2Service.js';

const POLL_INTERVAL = 1000; // 1 second between polls
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Maximum number of jobs to process per worker cycle
// This prevents hitting GitHub Actions step limits:
// - Each 1000-highlight chunk needs ~20-25 steps (batches of 50 + overhead)
// - Setting to 35 allows processing ~35,000 highlights while staying under the 1000 step limit
// - Leaves room for retries and additional overhead operations
const MAX_JOBS_PER_CYCLE = 35;

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
      
      // Track number of jobs processed to stay under GitHub Actions limits
      let jobsProcessed = 0;
      
      // Poll for available jobs from the queue (reduced from 10 to 5 to optimize R2 operations)
      let pollCount = 0;
      while (pollCount < 5 && jobsProcessed < MAX_JOBS_PER_CYCLE) {
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

          // Remove failed jobs from queue only
          if (jobState.state === 'failed') {
            logger.debug('Removing failed job from queue, keeping upload intact', {
              uploadId,
              currentState: jobState.state
            });
            await queueService.removeFromQueue(uploadId);
            // Don't call removeFromActive here - keep the upload active
            continue;
          }

          // Only process jobs in parsed state
          if (jobState.state !== 'parsed') {
            logger.debug('Job not ready for processing yet', {
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
              // First remove job from queue
              await queueService.removeFromQueue(uploadId);
              
              // Get final job state before cleanup
              const jobState = await jobStateService.getJobState(uploadId);
              if (!jobState) {
                logger.warn('Job state not found during final cleanup', { uploadId });
                break;
              }

              // For chunk jobs, handle differently
              if (jobState.isChunk && jobState.parentUploadId) {
                const uploadStatus = await jobStateService.getChunkedUploadStatus(jobState.parentUploadId);
                
                // Now we can safely delete the job state since we're done with it
                await jobStateService.deleteJob(uploadId);
                
                if (uploadStatus.isComplete) {
                  await queueService.removeFromActive(userId);
                  logger.debug('All chunks complete - removed user from active', {
                    userId,
                    parentUploadId: jobState.parentUploadId,
                    uploadStatus
                  });
                } else {
                  logger.debug('Chunk processed - waiting for other chunks', {
                    userId,
                    parentUploadId: jobState.parentUploadId,
                    uploadStatus
                  });
                }
              } else {
                // Regular job - clean up everything
                await jobStateService.deleteJob(uploadId);
                await queueService.removeFromActive(userId);
                logger.debug('Cleaned up standalone job completely', { userId, uploadId });
              }
            } catch (cleanupError) {
              logger.error('Error in final job cleanup', {
                userId,
                uploadId,
                error: cleanupError
              });
            }
            // Reset poll counter and increment processed jobs counter
            pollCount = 0;
            jobsProcessed++;
            
            if (jobsProcessed >= MAX_JOBS_PER_CYCLE) {
              logger.info(`Reached max jobs per cycle limit (${MAX_JOBS_PER_CYCLE}), will exit after cleanup`);
            }
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