import { logger } from '../utils/logger.js';
import { JobStatus } from '../types/job.js';
import { uploadObject, downloadObject, deleteObject, listObjects } from './r2Service.js';

// Processing jobs get 6 hours before considered stuck - they can take a long time due to:
// - Large number of highlights to process
// - Rate limiting and batching
// - Retries and error handling
const STUCK_JOB_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours for processing jobs

// Completed/failed jobs only need 5 minutes retention since:
// - Their highlights are already in Notion
// - Just need enough time to show status to user
const COMPLETED_JOB_TIMEOUT = 5 * 60 * 1000; // 5 minutes for completed jobs

// Run cleanup every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

class JobCleanupService {
  private interval: NodeJS.Timeout | null = null;

  async start() {
    if (this.interval) return;
    
    this.interval = setInterval(() => this.cleanupJobs(), CLEANUP_INTERVAL);
    logger.info('Job cleanup service started');
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('Job cleanup service stopped');
    }
  }

  private async cleanupJobs() {
    try {
      // Get all job status objects
      const jobStatuses = await listObjects('job-status/');
      logger.debug('Found job status objects', { count: jobStatuses.length });

      // Process each job
      for (const status of jobStatuses) {
        if (!status.key) continue;
        
        try {
          const data = await downloadObject(status.key);
          const jobStatus: JobStatus = JSON.parse(data.toString());
          const jobId = status.key.split('/')[1].replace('.json', '');
          
          logger.debug('Checking job for cleanup', {
            jobId,
            state: jobStatus.state,
            lastUpdate: jobStatus.lastCheckpoint || 0,
            completedAt: jobStatus.completedAt
          });

          if (await this.shouldCleanupJob(jobId, jobStatus)) {
            await this.cleanupJob(jobId, jobStatus);
          }
        } catch (error) {
          logger.error('Error processing job status', {
            key: status.key,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      logger.error('Error in cleanup job process', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async shouldCleanupJob(jobId: string, status: JobStatus): Promise<boolean> {
    if (status.state === 'completed' || status.state === 'failed') {
      // Clean up completed/failed jobs after 1 hour
      return Date.now() - (status.completedAt || 0) > COMPLETED_JOB_TIMEOUT;
    }

    if (status.state === 'processing') {
      // Check if job is still being processed by checking lastCheckpoint
      const lastUpdate = status.lastCheckpoint || 0;
      return Date.now() - lastUpdate > STUCK_JOB_TIMEOUT;
    }

    return false;
  }

  private async cleanupJob(jobId: string, status: JobStatus) {
    try {
      // Clean up highlights in temp storage
      await deleteObject(`temp-highlights/${jobId}.json`);
      
      // Clean up job status
      await deleteObject(`job-status/${jobId}.json`);
      
      // Clean up temp file content if it exists
      await deleteObject(`uploads/${jobId}.txt`);
      
      logger.info('Cleaned up job', {
        jobId,
        status: status.state,
        reason: status.state === 'processing' ? 'stuck' : 'completed/failed timeout',
        age: Date.now() - (status.completedAt || 0)
      });
    } catch (error) {
      logger.error('Error cleaning up job', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export const jobCleanupService = new JobCleanupService();