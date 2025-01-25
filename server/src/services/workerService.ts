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

// Maximum number of empty polls before exiting
const MAX_EMPTY_POLLS = 10; // Will exit after ~10 seconds of no jobs
const POLL_INTERVAL = 1000; // 1 second between polls

class WorkerService {
  private isRunning: boolean = false;
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
  private uploadQueue: string[] = [];
  private uploadProcessing = false;
  private activeUserUploads: Map<string, string> = new Map(); // userId → uploadId

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

    this.isRunning = true;
    logger.info('Starting worker service with sequential upload processing');

    // In local environment, run periodically every 30 seconds
    if (process.env.NODE_ENV === 'development') {
      const runWorker = async () => {
        try {
          await this.runWorkerCycle();
        } catch (error) {
          logger.error('Error in worker cycle', error);
        }
      };

      // Run immediately and then every 120 seconds
      runWorker();
      setInterval(runWorker, 120000);
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
              this.isRunning = false;
              break;
            }
            // No jobs available, wait before checking again
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }
          
          // Reset empty poll count when job is found
          this.emptyPollCount = 0;
          const { jobId, messageId, uploadId } = result;
          
          // If this is a new upload, add to queue
          // Get userId from job status
          const status = await getJobStatus(jobId);
          if (!status?.userId) {
            throw new Error('Cannot process job: userId not found');
          }

          // Check if user already has an upload in progress
          if (this.activeUserUploads.has(status.userId)) {
            throw new Error(`User ${status.userId} already has an upload in progress`);
          }

          // Check upload limit
          if (this.uploadQueue.length >= UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
            throw new Error(
              `Maximum active uploads reached (${UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS}). ` +
              'Please try again later.'
            );
          }

          if (uploadId && !this.uploadQueue.includes(uploadId)) {
            this.uploadQueue.push(uploadId);
            this.activeUserUploads.set(status.userId, uploadId);
          }

          // Wait if another upload is being processed
          while (this.uploadProcessing && this.currentUploadId !== uploadId) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Start processing this upload
          if (uploadId) {
            this.currentUploadId = uploadId;
            this.uploadProcessing = true;
          }

          this.currentJobId = jobId;

          // Update job status to processing
          await setJobStatus(jobId, {
            state: 'processing',
            message: 'Starting file processing',
            uploadId
          });

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
              const uploadComplete = await this.checkUploadCompletion(uploadId);
              if (uploadComplete) {
                this.uploadProcessing = false;
                this.currentUploadId = null;
                this.uploadQueue = this.uploadQueue.filter(id => id !== uploadId);
                
                // Clean up user tracking
                if (status?.userId) {
                  this.activeUserUploads.delete(status.userId);
                }
              }
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

            // If upload failed, clear it from processing and clean up jobs
            if (uploadId) {
              this.uploadProcessing = false;
              this.currentUploadId = null;
              this.uploadQueue = this.uploadQueue.filter(id => id !== uploadId);
              
              // Clean up all jobs for this upload
              const redis = await getRedis();
              try {
                // Remove all jobs with this uploadId
                await redis.xdel(STREAM_NAME, uploadId);
              } catch (error) {
                logger.error('Error cleaning up failed upload jobs', { uploadId, error });
              } finally {
                redisPool.release(redis);
              }
            }
          }

          // Acknowledge message after processing (whether successful or failed)
          await acknowledgeJob(messageId);
          this.currentJobId = null;

        } catch (error) {
          logger.error('Error in worker loop', error);
          // Wait before retrying on error
          await new Promise(resolve => setTimeout(resolve, UPLOAD_LIMITS.UPLOAD_LIMIT_RETRY_DELAY));
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

  private async runWorkerCycle(): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info('Starting local worker cycle');
      }
      
      // Initialize Redis stream and consumer group
      await initializeStream();

      // Process jobs until MAX_EMPTY_POLLS is reached
      let emptyPolls = 0;
      while (this.isRunning && emptyPolls < MAX_EMPTY_POLLS) {
        try {
          const result = await getNextJob();
          
          if (!result) {
            emptyPolls++;
            // No jobs available, wait before checking again
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }
          
          // Reset empty poll count when job is found
          emptyPolls = 0;
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
      logger.error('Error in worker cycle', error);
      throw error;
    } finally {
      try {
        await RedisService.cleanup();
        logger.info('Successfully cleaned up Redis connections after worker cycle');
      } catch (error) {
        logger.error('Error cleaning up Redis connections after worker cycle', { error });
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