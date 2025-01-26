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
  redisPool,
  type RedisType
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
  private currentJobId: string | null = null;
  private emptyPollCount: number = 0;
  private cleanupHandlers: (() => Promise<void>)[] = [];
  private redis: RedisType | null = null;

  async initRedis(redis: RedisType): Promise<void> {
    this.redis = redis;
    // Initialize Redis stream and consumer group
    await initializeStream();
    logger.info('Redis connection initialized in worker service');
  }

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

      // Run immediately and then every 120 seconds
      runWorker();
      setInterval(runWorker, 120000);
      return;
    }

    // Production behavior - run continuously
    try {
      await initializeStream();

      while (this.isRunning) {
        try {
          const result = await getNextJob();
          
          if (!result) {
            this.emptyPollCount++;
            if (this.emptyPollCount >= MAX_EMPTY_POLLS) {
              logger.info(`No jobs found after ${MAX_EMPTY_POLLS} attempts, stopping worker`);
              await this.stop();
              break;
            }
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }

          // Check if job is marked as parsed
          const jobStatus = await getJobStatus(result.jobId);
          if (jobStatus?.state !== 'parsed') {
            logger.info(`Skipping job ${result.jobId} - not marked as parsed`);
            // Don't acknowledge job yet - wait for it to be parsed
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }
          
          // Reset empty poll count when job is found
          this.emptyPollCount = 0;
          const { jobId, messageId, uploadId } = result;
          
          // Get userId from job status
          const status = await getJobStatus(jobId);
          if (!status?.userId) {
            throw new Error('Cannot process job: userId not found');
          }

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
            await processFile(jobId);

            await setJobStatus(jobId, {
              state: 'completed',
              message: 'File processing completed',
              completedAt: Date.now(),
              uploadId
            });

            if (uploadId) {
              const status = await getJobStatus(jobId);
              const uploadComplete = await this.checkUploadCompletion(uploadId);
              if (uploadComplete && status?.userId) {
                await completeUpload(uploadId, jobId);
                await workerStateService.setProcessingUpload(null);
                this.currentUploadId = null;
                await workerStateService.removeFromUploadQueue(uploadId);
                await workerStateService.removeActiveUserUpload(status.userId);
              }
            }

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await setJobStatus(jobId, {
              state: 'failed',
              message: `File processing failed: ${errorMessage}`,
              uploadId
            });
            logger.error('Job processing failed', { jobId, error });

            if (uploadId && status?.userId) {
              await completeUpload(uploadId, jobId);
              await workerStateService.setProcessingUpload(null);
              this.currentUploadId = null;
              await workerStateService.removeFromUploadQueue(uploadId);
              
              const redis = await getRedis();
              try {
                await redis.xdel(STREAM_NAME, uploadId);
              } catch (error) {
                logger.error('Error cleaning up failed upload jobs', { uploadId, error });
              } finally {
                redisPool.release(redis);
              }
            }
          }

          await acknowledgeJob(messageId);
          this.currentJobId = null;

        } catch (error) {
          logger.error('Error in worker loop', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
          await new Promise(resolve => setTimeout(resolve, Math.max(POLL_INTERVAL, UPLOAD_LIMITS.UPLOAD_LIMIT_RETRY_DELAY)));
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
    
    if (this.currentJobId) {
      logger.info('Worker stopped while processing job', { jobId: this.currentJobId });
    }
    
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
      
      let emptyPolls = 0;
      while (emptyPolls < MAX_EMPTY_POLLS) {
        try {
          const result = await getNextJob();
          
          if (!result) {
            emptyPolls++;
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }
          
          emptyPolls = 0;
          const { jobId, messageId } = result;
          this.currentJobId = jobId;
          
          // Check if job is marked as parsed
          const jobStatus = await getJobStatus(jobId);
          if (jobStatus?.state !== 'parsed') {
            logger.info(`Skipping job ${jobId} - not marked as parsed`);
            // Don't acknowledge yet - wait for it to be parsed
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            continue;
          }
          
          await setJobStatus(jobId, {
            ...jobStatus,
            state: 'processing',
            message: 'Starting file processing'
          });

          try {
            await processFile(jobId);

            const status = await getJobStatus(jobId);
            await setJobStatus(jobId, {
              ...status,
              state: 'completed',
              message: 'File processing completed',
              completedAt: Date.now()
            });

            if (status?.uploadId && status?.userId) {
              await completeUpload(status.uploadId, jobId);
            }

          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const status = await getJobStatus(jobId);
            await setJobStatus(jobId, {
              ...status,
              state: 'failed',
              message: `File processing failed: ${errorMessage}`
            });
            logger.error('Job processing failed', { jobId, error });

            if (status?.uploadId && status?.userId) {
              await completeUpload(status.uploadId, jobId);
            }
          }

          await acknowledgeJob(messageId);
          this.currentJobId = null;

        } catch (error) {
          logger.error('Error in worker loop', error);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    } catch (error) {
      logger.error('Error in worker cycle', error);
      throw error;
    } finally {
      try {
        await this.stop();
        logger.info('Worker cycle completed');
      } catch (error) {
        logger.error('Error during worker cycle cleanup', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  private async checkUploadCompletion(uploadId: string): Promise<boolean> {
    const redis = await getRedis();
    try {
      const jobs = await redis.xread('STREAMS', STREAM_NAME, '0-0');
      if (!jobs || jobs.length === 0) return true;

      const streamMessages = jobs[0][1];
      if (!streamMessages || streamMessages.length === 0) return true;

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
