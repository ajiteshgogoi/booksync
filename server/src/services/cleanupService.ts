import { getRedis, redisPool, ACTIVE_USERS_SET, STREAM_NAME, getJobStatus, JOB_TTL, acknowledgeJob } from './redisService.js';
import type { JobStatus } from '../types/job.js';
import { logger } from '../utils/logger.js';

interface UserState {
  hasActiveUploads: boolean;
  hasActiveJobs: boolean;
}

/**
 * Unified cleanup service that handles both upload and job cleanup
 * while maintaining consistency of the ACTIVE_USERS_SET
 */
export class CleanupService {
  private static readonly ACTIVE_STATES = ['pending', 'processing', 'queued'];

  /**
   * Get all users currently marked as active
   */
  private static async getActiveUsers(): Promise<string[]> {
    const redis = await getRedis();
    try {
      return await redis.smembers(ACTIVE_USERS_SET);
    } finally {
      redisPool.release(redis);
    }
  }

  /**
   * Check if user has any active uploads and handle TTL
   */
  private static async checkUserUploads(userId: string): Promise<boolean> {
    const redis = await getRedis();
    try {
      const uploadStatus = await redis.get(`UPLOAD_STATUS:${userId}`);
      if (!uploadStatus) {
        logger.debug(`No upload status found for user ${userId}`);
        return false;
      }

      const ttl = await redis.ttl(`UPLOAD_STATUS:${userId}`);
      if (ttl <= 0) {
        logger.debug(`Upload status expired for user ${userId}`);
        return false;
      }

      // If upload is still valid, refresh TTL
      await Promise.all([
        redis.expire(`UPLOAD_STATUS:${userId}`, JOB_TTL),
        redis.expire(`UPLOAD_JOBS:${uploadStatus}`, JOB_TTL)
      ]);
      logger.debug(`Refreshed TTL for active upload ${uploadStatus} (user ${userId})`);
      return true;
    } finally {
      redisPool.release(redis);
    }
  }

  /**
   * Check if user has any active jobs in the stream
   */
  private static async checkUserJobs(userId: string): Promise<boolean> {
    const redis = await getRedis();
    try {
      const results = await redis.xread('STREAMS', STREAM_NAME, '0-0');
      if (!results || results.length === 0) return false;

      const streamMessages = results[0][1];
      if (!streamMessages || streamMessages.length === 0) return false;

      // Check if any job belongs to the user and is still active
      for (const [messageId, fields] of streamMessages) {
        const jobId = fields[fields.indexOf('jobId') + 1];
        const jobUserId = fields[fields.indexOf('userId') + 1];
        
        if (jobUserId === userId) {
          try {
            const status = await getJobStatus(jobId);
            if (status && this.ACTIVE_STATES.includes(status.state)) {
              // Refresh TTL for active job status
              await redis.expire(`job:${jobId}:status`, JOB_TTL);
              logger.debug(`Refreshed TTL for active job ${jobId} (user ${userId})`);
              return true;
            } else if (!status || !this.ACTIVE_STATES.includes(status.state)) {
              // Acknowledge completed/failed jobs in the stream
              await acknowledgeJob(messageId);
              logger.debug(`Acknowledged completed/failed job ${jobId} in stream`);
            }
          } catch (error) {
            logger.error(`Error checking job status for ${jobId}:`, error);
            continue;
          }
        }
      }
      
      return false;
    } finally {
      redisPool.release(redis);
    }
  }

  /**
   * Clean up stale upload keys for a user
   */
  private static async cleanupUserUploads(userId: string): Promise<void> {
    const redis = await getRedis();
    try {
      const uploadId = await redis.get(`UPLOAD_STATUS:${userId}`);
      if (uploadId) {
        const ttl = await redis.ttl(`UPLOAD_STATUS:${userId}`);
        if (ttl <= 0) {
          await Promise.all([
            redis.del(`UPLOAD_STATUS:${userId}`),
            redis.del(`UPLOAD_JOBS:${uploadId}`)
          ]);
          logger.info(`Cleaned up stale upload ${uploadId} for user ${userId}`);
        }
      }
    } catch (error) {
      logger.error(`Error cleaning up uploads for user ${userId}:`, error);
    } finally {
      redisPool.release(redis);
    }
  }

  /**
   * Clean up expired job statuses and their related resources
   */
  private static async cleanupStaleJobs(): Promise<void> {
    const redis = await getRedis();
    try {
      const keys = await redis.keys('job:*:status');
      for (const key of keys) {
        try {
          const ttl = await redis.ttl(key);
          if (ttl <= 0) {
            const jobStatus = await redis.get(key);
            if (jobStatus) {
              try {
                const status: JobStatus = JSON.parse(jobStatus);
                if (status.uploadId) {
                  const jobId = key.split(':')[1];
                  // Remove job from upload tracking and possibly trigger upload cleanup
                  await redis.srem(`UPLOAD_JOBS:${status.uploadId}`, jobId);
                  
                  // Check if this was the last job in the upload
                  const remainingJobs = await redis.scard(`UPLOAD_JOBS:${status.uploadId}`);
                  if (remainingJobs === 0 && status.userId) {
                    // Clean up the upload entirely
                    await Promise.all([
                      redis.del(`UPLOAD_STATUS:${status.userId}`),
                      redis.del(`UPLOAD_JOBS:${status.uploadId}`)
                    ]);
                    logger.info(`Cleaned up completed upload ${status.uploadId} for user ${status.userId}`);
                  }
                }
              } catch (parseError) {
                logger.error(`Error parsing job status for ${key}:`, parseError);
              }
            }
            await redis.del(key);
            logger.debug(`Removed expired job status key: ${key}`);
          }
        } catch (error) {
          logger.error(`Error processing stale job key ${key}:`, error);
          continue;
        }
      }
    } finally {
      redisPool.release(redis);
    }
  }

  /**
   * Update user's active status based on current state
   */
  private static async updateUserActiveStatus(
    userId: string, 
    state: UserState
  ): Promise<void> {
    const redis = await getRedis();
    try {
      if (!state.hasActiveUploads && !state.hasActiveJobs) {
        await redis.srem(ACTIVE_USERS_SET, userId);
        logger.info(`Removed inactive user ${userId} from active set`);
      }
    } finally {
      redisPool.release(redis);
    }
  }

  /**
   * Main cleanup method that coordinates the entire cleanup process
   */
  public static async cleanup(): Promise<void> {
    const startTime = Date.now();
    logger.info('Starting unified cleanup process');
    
    try {
      await this.cleanupStaleJobs();
      logger.info('Stale jobs cleanup completed');

      const activeUsers = await this.getActiveUsers();
      logger.info(`Processing ${activeUsers.length} active users`);
      
      let processedCount = 0;
      let removedCount = 0;

      for (const userId of activeUsers) {
        try {
          const [hasActiveUploads, hasActiveJobs] = await Promise.all([
            this.checkUserUploads(userId),
            this.checkUserJobs(userId)
          ]);

          if (!hasActiveUploads) {
            await this.cleanupUserUploads(userId);
          }

          if (!hasActiveUploads && !hasActiveJobs) {
            removedCount++;
          }

          await this.updateUserActiveStatus(userId, {
            hasActiveUploads,
            hasActiveJobs
          });

          processedCount++;
        } catch (error) {
          logger.error(`Error cleaning up user ${userId}:`, error);
          continue;
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Cleanup process completed', {
        duration: `${duration}ms`,
        processedUsers: processedCount,
        removedUsers: removedCount
      });
    } catch (error) {
      logger.error('Error in cleanup process:', error);
      throw error;
    }
  }
}
