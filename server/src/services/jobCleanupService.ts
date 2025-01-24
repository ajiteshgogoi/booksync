import { getRedis } from './redisService.js';
import { logger } from '../utils/logger.js';
import { JobStatus } from '../types/job.js';

const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const STUCK_JOB_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

class JobCleanupService {
  private interval: NodeJS.Timeout | null = null;

  async start() {
    if (this.interval) return;
    
    // Run initial cleanup
    await this.cleanupJobs();
    
    // Set up periodic cleanup
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
    const redis = await getRedis();
    try {
      // Clean up completed/failed jobs
      const jobKeys = await redis.keys('job:*:status');
      const now = Date.now();
      
      for (const key of jobKeys) {
        const status = await redis.get(key);
        if (!status) continue;
        
        const jobStatus: JobStatus = JSON.parse(status);
        
        // Clean up old completed/failed jobs
        if (['completed', 'failed'].includes(jobStatus.state)) {
          if (now - (jobStatus.completedAt || 0) > STUCK_JOB_TIMEOUT) {
            await this.cleanupJob(key, jobStatus);
          }
        }
        
        // Clean up stuck processing jobs
        if (jobStatus.state === 'processing' && 
            now - (jobStatus.lastProcessedIndex || 0) > STUCK_JOB_TIMEOUT) {
          await this.cleanupJob(key, jobStatus);
        }
      }
      
      // Clean up orphaned stream entries
      const streamData = await redis.xrange('sync_jobs_stream', '-', '+');
      for (const [id, fields] of streamData) {
        const jobIdIndex = fields.indexOf('jobId');
        if (jobIdIndex === -1) continue;
        
        const jobId = fields[jobIdIndex + 1];
        if (!await redis.exists(`job:${jobId}:status`)) {
          await redis.xdel('sync_jobs_stream', id);
        }
      }
    } finally {
      redis.quit();
    }
  }

  private async cleanupJob(key: string, status: JobStatus) {
    const redis = await getRedis();
    try {
      const jobId = key.split(':')[1];
      
      // Clean up highlights
      const highlightKeys = await redis.keys(`highlights:${jobId}:*`);
      if (highlightKeys.length > 0) {
        await redis.del(...highlightKeys);
      }
      
      // Clean up job status
      await redis.del(key);
      
      // Remove from active users
      if (status.userId) {
        await redis.srem('active_users', status.userId);
      }
      
      logger.info('Cleaned up job', { jobId, status: status.state });
    } finally {
      redis.quit();
    }
  }
}

export const jobCleanupService = new JobCleanupService();