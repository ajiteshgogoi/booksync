import { logger } from '../utils/logger.js';
import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import {
  getRedis,
  getNextJob,
  setJobStatus,
  getJobStatus,
  acknowledgeJob,
  STREAM_NAME,
  redisPool
} from './redisService.js';
import { processFile } from './processService.js';
import { completeJob as completeUpload } from './uploadTrackingService.js';
import { workerStateService } from './workerStateService.js';

const POLL_INTERVAL = 1000; // 1 second between polls

export class DevWorkerService {
  private isRunning: boolean = false;
  private shouldContinue: boolean = false;
  private currentJobId: string | null = null;
  private currentUploadId: string | null = null;

  async start(): Promise<void> {
    logger.info('Starting development worker service');
    
    const runWorker = async () => {
      try {
        await this.runWorkerCycle();
      } catch (error) {
        logger.error('Error in worker cycle', error);
      }
    };

    // Setup recursive worker execution that enforces 30s delay between cycles
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
        
        await new Promise(resolve => setTimeout(resolve, 125000));
        
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
  }

  async stop(): Promise<void> {
    logger.info('Stopping development worker service');
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
      logger.info('Starting local worker cycle - will poll until job found or max 10 times');
      
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
          
          const { jobId, messageId, uploadId } = result;
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

          // Update job status to processing
          await setJobStatus(jobId, {
            state: 'processing',
            message: 'Starting file processing',
            uploadId
          });

          try {
            await processFile(jobId);

            // Update job status to completed
            await setJobStatus(jobId, {
              state: 'completed',
              message: 'File processing completed',
              completedAt: Date.now(),
              uploadId
            });

            // Handle upload completion
            const completedStatus = await getJobStatus(jobId);
            if (uploadId && completedStatus?.userId) {
              // Call upload tracking service to handle complete cleanup
              await completeUpload(uploadId, jobId);
              // Clean up worker state
              await workerStateService.setProcessingUpload(null);
              this.currentUploadId = null;
              await workerStateService.removeFromUploadQueue(uploadId);
              await workerStateService.removeActiveUserUpload(completedStatus.userId);
            }

            // Job processed successfully, acknowledge and break the cycle
            await acknowledgeJob(messageId);
            logger.info('Job processed successfully, stopping cycle');
            break;
          } catch (error: unknown) {
            // Handle job processing error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            await setJobStatus(jobId, {
              state: 'failed',
              message: `File processing failed: ${errorMessage}`,
              uploadId
            });
            logger.error('Job processing failed', { jobId, error });

            // Handle upload failure
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

            // Acknowledge the failed job and break the cycle
            await acknowledgeJob(messageId);
            logger.info('Job failed, stopping cycle');
            break;
          }

          // Reset currentJobId and uploadId
          this.currentJobId = null;
          this.currentUploadId = null;

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
      this.currentUploadId = null;
      this.isRunning = false;
      
      logger.info('Local worker cycle completed - waiting for next scheduled run');
    }
  }
}

// Create singleton instance
export const devWorkerService = new DevWorkerService();