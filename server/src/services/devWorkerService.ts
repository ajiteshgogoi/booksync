import { logger } from '../utils/logger.js';
import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import { processFile } from './processService.js';
import { completeJob as completeUpload } from './uploadTrackingService.js';
import { queueService } from './queueService.js';
import { jobStateService } from './jobStateService.js';

const POLL_INTERVAL = 1000; // 1 second between polls

export class DevWorkerService {
  private isRunning: boolean = false;
  private shouldContinue: boolean = false;
  private currentJobId: string | null = null;

  async start(): Promise<void> {
    logger.info('Starting development worker service');
    
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
        logger.info('Worker cycle completed. Starting 120 second delay...');
        
        // Use a separate flag to track if we're stopping completely
        if (!this.shouldContinue) break;
        
        await new Promise(resolve => setTimeout(resolve, 120000));
        
        // Check again if we should continue after the delay
        if (!this.shouldContinue) break;
        
        logger.info('200 second delay completed, starting next cycle...');
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

            // Handle upload completion
            await completeUpload(uploadId, this.currentJobId);
            
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

            // Handle upload failure cleanup
            await completeUpload(uploadId, this.currentJobId);
            
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
      // Mark cycle as completed and cleanup
      logger.info('Local worker cycle completed');
      this.currentJobId = null;
      this.isRunning = false;
      
      logger.info('Local worker cycle completed - waiting for next scheduled run');
    }
  }
}

// Create singleton instance
export const devWorkerService = new DevWorkerService();