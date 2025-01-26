import { getRedis, redisPool, JOB_TTL, ACTIVE_USERS_SET, getJobStatus } from './redisService.js';
import type { JobStatus } from '../types/job.js';
import { logger } from '../utils/logger.js';

export async function startUpload(userId: string, uploadId: string): Promise<void> {
  const redis = await getRedis();
  try {
    // Check if user has an active upload
    const activeUpload = await redis.get(`UPLOAD_STATUS:${userId}`);
    if (activeUpload) {
      throw new Error('User already has an active file upload');
    }

    // Mark upload as active and add user to active set with TTL
    await Promise.all([
      redis.set(`UPLOAD_STATUS:${userId}`, uploadId, 'EX', JOB_TTL),
      redis.sadd(ACTIVE_USERS_SET, userId)
    ]);

    // Initialize empty upload jobs set with TTL
    await redis.expire(`UPLOAD_JOBS:${uploadId}`, JOB_TTL);
    
    logger.debug(`Started new upload ${uploadId} for user ${userId}`);
  } catch (error) {
    logger.error(`Error starting upload for user ${userId}:`, error);
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

export async function addJobToUpload(uploadId: string, jobId: string): Promise<void> {
  const redis = await getRedis();
  try {
    // Add job to upload set and refresh TTLs
    await Promise.all([
      redis.sadd(`UPLOAD_JOBS:${uploadId}`, jobId),
      redis.expire(`UPLOAD_JOBS:${uploadId}`, JOB_TTL)
    ]);
    
    logger.debug(`Added job ${jobId} to upload ${uploadId}`);
  } catch (error) {
    logger.error(`Error adding job ${jobId} to upload ${uploadId}:`, error);
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

export async function completeJob(uploadId: string, jobId: string): Promise<boolean> {
  const redis = await getRedis();
  try {
    // Get job status before removing
    const status = await getJobStatus(jobId);
    if (!status?.userId) {
      logger.warn(`No user found for job ${jobId} in upload ${uploadId}`);
      return false;
    }

    // Remove job from upload tracking
    const remainingJobs = await redis.srem(`UPLOAD_JOBS:${uploadId}`, jobId);
    
    // If no more jobs, clean up all upload tracking
    if (remainingJobs === 0) {
      logger.info(`Completing upload ${uploadId} for user ${status.userId}`);
      
      // Clean up all upload-related keys atomically
      await Promise.all([
        redis.del(`UPLOAD_STATUS:${status.userId}`),
        redis.del(`UPLOAD_JOBS:${uploadId}`),
        redis.srem(ACTIVE_USERS_SET, status.userId)
      ]);
      
      return true;
    }
    
    // If there are remaining jobs, refresh TTLs
    else {
      await Promise.all([
        redis.expire(`UPLOAD_STATUS:${status.userId}`, JOB_TTL),
        redis.expire(`UPLOAD_JOBS:${uploadId}`, JOB_TTL)
      ]);
    }
    
    return false;
  } catch (error) {
    logger.error(`Error completing job ${jobId} in upload ${uploadId}:`, error);
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

export async function getUploadStatus(userId: string): Promise<string | null> {
  const redis = await getRedis();
  try {
    const uploadId = await redis.get(`UPLOAD_STATUS:${userId}`);
    if (uploadId) {
      // Refresh TTLs when checking status
      await Promise.all([
        redis.expire(`UPLOAD_STATUS:${userId}`, JOB_TTL),
        redis.expire(`UPLOAD_JOBS:${uploadId}`, JOB_TTL)
      ]);
    }
    return uploadId;
  } catch (error) {
    logger.error(`Error getting upload status for user ${userId}:`, error);
    throw error;
  } finally {
    redisPool.release(redis);
  }
}
