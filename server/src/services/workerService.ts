import { logger } from '../utils/logger.js';
import { getRedis, initializeStream, getNextJob, setJobStatus, acknowledgeJob } from './redisService.js';
import { processFile } from './processService.js';
import type { JobStatus } from './redisService.js';

class WorkerService {
  private isRunning: boolean = false;
  private currentJobId: string | null = null;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting worker service');

    try {
      // Initialize Redis stream and consumer group
      const redis = await getRedis();
      await initializeStream(redis);

      // Start processing loop
      while (this.isRunning) {
        try {
          const result = await getNextJob();
          
          if (!result) {
            // No jobs available, wait before checking again
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }

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
  }

  getCurrentJob(): string | null {
    return this.currentJobId;
  }
}

// Create singleton instance
const workerService = new WorkerService();
export default workerService;