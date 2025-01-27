import { logger } from '../utils/logger.js';
import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import {
  getRedis,
  initializeStream,
  getNextJob,
  setJobStatus,
  getJobStatus,
  acknowledgeJob,
  RedisService,
  STREAM_NAME,
  redisPool
} from './redisService.js';
import { processFile } from './processService.js';
import type { JobStatus } from '../types/job.js';
import { workerStateService } from './workerStateService.js';
import { completeJob as completeUpload } from './uploadTrackingService.js';

// Maximum number of empty polls before exiting
const MAX_EMPTY_POLLS = 10; // Will exit after ~10 seconds of no jobs
const POLL_INTERVAL = 1000; // 1 second between polls

class WorkerService {
  private isRunning: boolean = false;
  private shouldContinue: boolean = false;
  private currentJobId: string | null = null;
  private emptyPollCount: number = 0;
  private cleanupHandlers: (() => Promise<void>)[] = [];

  constructor() {
    // Setup signal handlers for graceful shutdown
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);
    this.shouldContinue = false;
    this.isRunning = false;
    
    // Run all cleanup handlers
    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Error during cleanup handler execution', { error });
      }
    }
    
    // Force exit after cleanup
    process.exit(0);
  }

  private currentUploadId: string | null = null;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }

    // Register cleanup handlers
    this.cleanupHandlers.push(
      async () => {
        try {
          await this.stop();
        } catch (error) {
          logger.error('Error during worker cleanup', { error });
        }
      }
    );

    logger.info('Starting worker service with sequential upload processing');

    // Initialize Redis stream and consumer group
    try {
      await initializeStream();
      logger.info('Redis stream and consumer group initialized');
    } catch (error) {
      logger.error('Failed to initialize Redis stream', error);
      throw error;
    }

    this.isRunning = true;

    // In local environment, run periodically every 30 seconds
    if (process.env.NODE_ENV === 'development') {
      const runWorker = async () => {
        try {
          await this.runWorkerCycle();
        } catch (error) {
          logger.error('Error in worker cycle', error);
        }
      };

      // Setup recursive worker execution that enforces 120s delay between cycles
      const scheduleNextRun = async () => {
        while (true) {
          // Start a cycle
          this.isRunning = true;
          await runWorker();
          
          // After cycle completes, wait for cleanup to finish
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          this.isRunning = false;
          logger.info('Worker cycle completed. Starting 30 second delay...');
          
          // Use a separate flag to track if we're stopping completely
          if (!this.shouldContinue) break;
          
          await new Promise(resolve => setTimeout(resolve, 30000));
          
          // Check again if we should continue after the delay
          if (!this.shouldContinue) break;
          
          logger.info('30 second delay completed, starting next cycle...');
        }
        
        logger.info('Worker scheduler stopped');
      };

      // Initialize and start the first cycle
      this.shouldContinue = true;
      this.isRunning = true;
      scheduleNextRun().catch(error => {
        logger.error('Error in worker scheduler', error);
        this.shouldContinue = false;
        this.isRunning = false;
      });
      
      return;
    }

    // Production behavior - run continuously

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
              await this.stop(); // Use stop() to properly cleanup
              return; // Exit the start method entirely
            }
            // No jobs available, wait before checking again
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }
          
          const { jobId, messageId, uploadId } = result;
          
          // If this is a new upload, add to queue
          // Get job status and verify state
          const status = await getJobStatus(jobId);
          if (!status?.userId) {
            throw new Error('Cannot process job: userId not found');
          }
          
          // Only process jobs in 'parsed' state
          if (status.state !== 'parsed') {
           logger.info(`Skipping job ${jobId} - not in parsed state (current state: ${status.state})`);
           this.emptyPollCount++;
           continue;
          }

          // Reset empty poll count when we find a job in parsed state
          this.emptyPollCount = 0;

          // Check if user already has an upload in progress
          const activeUpload = await workerStateService.getActiveUserUpload(status.userId);
          if (activeUpload) {
            throw new Error(`User ${status.userId} already has an upload in progress`);
          }

          // Check upload limit
          const queueLength = await workerStateService.getUploadQueueLength();
          if (queueLength >= UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
            throw new Error(
              `Maximum active uploads reached (${UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS}). ` +
              'Please try again later.'
            );
          }

          if (uploadId && !(await workerStateService.isInUploadQueue(uploadId))) {
            await workerStateService.addToUploadQueue(uploadId);
            await workerStateService.setActiveUserUpload(status.userId, uploadId);
          }

          // Wait if another upload is being processed
          while (await workerStateService.isUploadProcessing() &&
                 (await workerStateService.getCurrentProcessingUpload()) !== uploadId) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Start processing this upload
          if (uploadId) {
            this.currentUploadId = uploadId;
            await workerStateService.setProcessingUpload(uploadId);
          }

          this.currentJobId = jobId;

          // Update job status to processing
          await setJobStatus(jobId, {
            state: 'processing',
            message: 'Starting file processing',
            uploadId
          });

          try {
            try {
              // Process the job with highlight limit
              await processFile(jobId);
              
              // Update job status to completed
              await setJobStatus(jobId, {
                state: 'completed',
                message: 'File processing completed',
                completedAt: Date.now(),
                uploadId
              });

              // If this was the last job in the upload, mark upload complete
              if (uploadId) {
                const status = await getJobStatus(jobId);
                if (status?.userId) {
                  // Call upload tracking service to handle complete cleanup
                  await completeUpload(uploadId, jobId);
                  // Clean up worker state
                  await workerStateService.setProcessingUpload(null);
                  this.currentUploadId = null;
                  await workerStateService.removeFromUploadQueue(uploadId);
                  await workerStateService.removeActiveUserUpload(status.userId);
                }
              }
            } finally {
              // Acknowledge message once after processing is complete or failed
              await acknowledgeJob(messageId);
            }

          } catch (error) {

            // Handle job processing error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await setJobStatus(jobId, {
              state: 'failed',
              message: `File processing failed: ${errorMessage}`,
              uploadId
            });
            logger.error('Job processing failed', { jobId, error });

            // If upload failed, perform complete cleanup
            if (uploadId && status?.userId) {
              // Call upload tracking service to handle complete cleanup
              await completeUpload(uploadId, jobId);
              // Clean up worker state
              await workerStateService.setProcessingUpload(null);
              this.currentUploadId = null;
              await workerStateService.removeFromUploadQueue(uploadId);
              
              // Clean up all jobs for this upload
              const redis = await getRedis();
              try {
                // Remove all jobs with this uploadId from stream
                await redis.xdel(STREAM_NAME, uploadId);
              } catch (error) {
                logger.error('Error cleaning up failed upload jobs', { uploadId, error });
              } finally {
                redisPool.release(redis);
              }
            }
          }

          this.currentJobId = null;

        } catch (error) {
          logger.error('Error in worker loop', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
          // Wait before retrying on error
          await new Promise(resolve => setTimeout(resolve, Math.max(POLL_INTERVAL, UPLOAD_LIMITS.UPLOAD_LIMIT_RETRY_DELAY)));
        }
      }
    } catch (error) {
      logger.error('Fatal error in worker service', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(fullStop: boolean = true): Promise<void> {
    if (fullStop) {
      logger.info('Stopping worker service completely');
      this.shouldContinue = false;
      this.isRunning = false;
      this.emptyPollCount = 0;
      
      // Log worker exit reason
      if (this.currentJobId) {
        logger.info('Worker stopped while processing job', { jobId: this.currentJobId });
      }
      
      // Only cleanup Redis on full stop
      try {
        await RedisService.cleanup();
        logger.info('Successfully cleaned up Redis connections');
      } catch (error) {
        logger.error('Error cleaning up Redis connections', { error });
      }

      // Ensure we wait for any ongoing operations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      // Just reset running state for cycle stop
      logger.info('Stopping current worker cycle');
      this.isRunning = false;
      this.emptyPollCount = 0;
    }
  }

  private async runWorkerCycle(): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Starting local worker cycle - will poll until job found or max 10 times');
      }
      
      // Poll up to 10 times or until a job is processed
      let pollCount = 0;
      while (pollCount < 10) {
        if (!this.isRunning) {
          logger.info('Worker cycle stopped before completion');
          return;
        }

        pollCount++;
        logger.info(`Starting poll ${pollCount} of max 10`);
        
        try {
          const result = await getNextJob();
          
          if (!result) {
            logger.info(`No jobs found in poll ${pollCount}`);
            // No jobs available, wait before checking again
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }
          
          const { jobId, messageId } = result;
          this.currentJobId = jobId;

          // Get job status and verify state
          const status = await getJobStatus(jobId);
          if (!status?.userId) {
            throw new Error('Cannot process job: userId not found');
          }

          // Only process jobs in 'parsed' state
          if (status.state !== 'parsed') {
           logger.info(`Skipping job ${jobId} - not in parsed state (current state: ${status.state})`);
           continue;
          }

          logger.info(`Found job in parsed state on poll ${pollCount} - will process and stop cycle`);

          // Update job status to processing
          await setJobStatus(jobId, {
            state: 'processing',
            message: 'Starting file processing'
          });

          // Process the job and then stop the cycle
          try {
            await processFile(jobId);

            // Update job status to completed
            const updatedStatus = await getJobStatus(jobId);
            await setJobStatus(jobId, {
              ...updatedStatus,
              state: 'completed',
              message: 'File processing completed',
              completedAt: Date.now()
            });

            // Handle upload completion in dev mode
            const completedStatus = updatedStatus ?? await getJobStatus(jobId);
            if (completedStatus?.uploadId && completedStatus.userId) {
              await completeUpload(completedStatus.uploadId, jobId);
            }

            // Job processed successfully, acknowledge and break the cycle
            await acknowledgeJob(messageId);
            logger.info('Job processed successfully, stopping cycle');
            break;
          } catch (error: unknown) {
            // Handle job processing error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const failedStatus = await getJobStatus(jobId);
            if (failedStatus) {
              await setJobStatus(jobId, {
                ...failedStatus,
                state: 'failed',
                message: `File processing failed: ${errorMessage}`
              });

              // Handle upload failure in dev mode
              if (failedStatus.uploadId && failedStatus.userId) {
                await completeUpload(failedStatus.uploadId, jobId);
              }
            }

            // Acknowledge the failed job and break the cycle
            await acknowledgeJob(messageId);
            logger.info('Job failed, stopping cycle');
            break;
          }

          // Reset currentJobId
          this.currentJobId = null;

        } catch (error) {
          logger.error('Error in worker loop', error);
          // Wait before retrying on error
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      logger.error('Error in worker cycle', error);
      throw error;
    } finally {
      // Mark cycle as completed and cleanup
      logger.info('Worker cycle completed');
      this.currentJobId = null;
      
      // Stop this cycle but don't cleanup Redis connections
      // This allows us to maintain the connections between cycles
      this.isRunning = false;
      this.emptyPollCount = 0;
      
      if (process.env.NODE_ENV === 'development') {
        logger.info('Local worker cycle completed - waiting for next scheduled run');
      }
    }
  }

  private async checkUploadCompletion(uploadId: string): Promise<boolean> {
    const redis = await getRedis();
    try {
      // Get all jobs for this upload
      const jobs = await redis.xread('STREAMS', STREAM_NAME, '0-0');
      if (!jobs || jobs.length === 0) return true;

      const streamMessages = jobs[0][1];
      if (!streamMessages || streamMessages.length === 0) return true;

      // Check if any jobs remain for this upload
      const remainingJobs = streamMessages.filter(([_, fields]) => {
        const uploadIdIndex = fields.indexOf('uploadId');
        return uploadIdIndex !== -1 &&
               fields[uploadIdIndex + 1] === uploadId;
      });

      return remainingJobs.length === 0;
    } finally {
      redisPool.release(redis);
    }
  }

  getCurrentJob(): string | null {
    return this.currentJobId;
  }
}

// Create singleton instance
export const workerService = new WorkerService();