import { getRedis, redisPool } from './redisService.js';
import { logger } from '../utils/logger.js';
import { JobStatus } from '../types/job.js';

// Processing jobs get 24 hours before considered stuck - they can take a long time due to:
// - Large number of highlights to process
// - Rate limiting and batching
// - Retries and error handling
const STUCK_JOB_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours for processing jobs

// Completed/failed jobs only need 1 hour retention since:
// - Their highlights are already in Notion
// - Just need enough time to show status to user
// - No need to keep them longer taking up Redis space
const COMPLETED_JOB_TIMEOUT = 60 * 60 * 1000; // 1 hour for completed jobs

// Stream entries should be cleaned up after same time as stuck jobs
// to ensure we don't delete streams for jobs still being processed
const STREAM_ENTRY_TIMEOUT = STUCK_JOB_TIMEOUT; // 24 hours for stream entries

// Run cleanup every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

class JobCleanupService {
  private interval: NodeJS.Timeout | null = null;

  async start() {
    if (this.interval) return;
    
    // Set up periodic cleanup
    // Note: No immediate cleanup - let the interval handle it to avoid
    // cleaning up jobs that are just getting started
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
    let redis;
    try {
      redis = await getRedis();

      // Get all job status keys
      const jobKeys = await redis.keys('job:*:status');
      logger.debug('Found job status keys', { count: jobKeys.length });

      // Process each job
      for (const key of jobKeys) {
        const status = await redis.get(key);
        if (!status) continue;
        
        try {
          const jobStatus: JobStatus = JSON.parse(status);
          const jobId = key.split(':')[1];
          
          logger.debug('Checking job for cleanup', {
            jobId,
            state: jobStatus.state,
            lastUpdate: jobStatus.lastProcessedIndex || jobStatus.lastCheckpoint || 0,
            completedAt: jobStatus.completedAt
          });

          // Check if job should be cleaned up
          if (await this.shouldCleanupJob(jobId, jobStatus)) {
            await this.cleanupJob(jobId, jobStatus);
          }
        } catch (error) {
          logger.error('Error processing job status', {
            key,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Clean up stream entries
      const streamData = await redis.xrange('sync_jobs_stream', '-', '+');
      logger.debug('Found stream entries', { count: streamData.length });

      const now = Date.now();
      for (const [id, fields] of streamData) {
        const streamTimestamp = Number(id.split('-')[0]); // Redis stream IDs are timestamp-sequence
        const jobIdIndex = fields.indexOf('jobId');
        
        if (jobIdIndex === -1) continue;
        
        const jobId = fields[jobIdIndex + 1];
        const jobExists = await redis.exists(`job:${jobId}:status`);
        
        // Clean up stream entry if either:
        // 1. Its corresponding job status doesn't exist (orphaned)
        // 2. It's older than the stream timeout
        if (!jobExists || (now - streamTimestamp) > STREAM_ENTRY_TIMEOUT) {
          await redis.xdel('sync_jobs_stream', id);
          logger.info('Removed stream entry', {
            jobId,
            reason: !jobExists ? 'orphaned' : 'timeout',
            age: now - streamTimestamp
          });
        }
      }
    } catch (error) {
      logger.error('Error in cleanup job process', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      // Return connection to pool
      if (redis) {
        redisPool.release(redis);
      }
    }
  }

  private async shouldCleanupJob(jobId: string, status: JobStatus): Promise<boolean> {
    let redis;
    try {
      redis = await getRedis();

      if (status.state === 'completed' || status.state === 'failed') {
        // Clean up completed/failed jobs after 1 hour
        return Date.now() - (status.completedAt || 0) > COMPLETED_JOB_TIMEOUT;
      }

      if (status.state === 'processing') {
        // Check if job is in the stream and being processed
        const streamData = await redis.xrange('sync_jobs_stream', '-', '+');
        const isInStream = streamData.some(([_, fields]) => {
          const jobIdIndex = fields.indexOf('jobId');
          return jobIdIndex !== -1 && fields[jobIdIndex + 1] === jobId;
        });

        if (isInStream) {
          // Job is still being processed
          return false;
        }

        // If not in stream, check if it's been stuck for too long
        const lastUpdate = status.lastProcessedIndex || status.lastCheckpoint || 0;
        return Date.now() - lastUpdate > STUCK_JOB_TIMEOUT;
      }

      return false;
    } finally {
      // Return connection to pool
      if (redis) {
        redisPool.release(redis);
      }
    }
  }

  private async cleanupJob(jobId: string, status: JobStatus) {
    let redis;
    try {
      redis = await getRedis();
      
      // Clean up highlights
      const highlightKeys = await redis.keys(`highlights:${jobId}:*`);
      if (highlightKeys.length > 0) {
        await redis.del(...highlightKeys);
      }
      
      // Clean up job status
      await redis.del(`job:${jobId}:status`);
      
      // Remove from active users
      if (status.userId) {
        await redis.srem('active_users', status.userId);
      }
      
      logger.info('Cleaned up job', { 
        jobId, 
        status: status.state,
        reason: status.state === 'processing' ? 'stuck' : 'completed/failed timeout',
        age: Date.now() - (status.completedAt || 0)
      });
    } finally {
      // Return connection to pool
      if (redis) {
        redisPool.release(redis);
      }
    }
  }
}

export const jobCleanupService = new JobCleanupService();