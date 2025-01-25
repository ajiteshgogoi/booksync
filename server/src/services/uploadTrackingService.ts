import { getRedis, redisPool, JOB_TTL, ACTIVE_USERS_SET, getJobStatus } from './redisService.js';
import type { JobStatus } from '../types/job.js';

export async function startUpload(userId: string, uploadId: string): Promise<void> {
  const redis = await getRedis();
  try {
    // Check if user has an active upload
    const activeUpload = await redis.get(`UPLOAD_STATUS:${userId}`);
    if (activeUpload) {
      throw new Error('User already has an active file upload');
    }

    // Mark upload as active and add user to active set
    await Promise.all([
      redis.set(`UPLOAD_STATUS:${userId}`, uploadId, 'EX', JOB_TTL),
      redis.sadd(ACTIVE_USERS_SET, userId)
    ]);
  } finally {
    redisPool.release(redis);
  }
}

export async function addJobToUpload(uploadId: string, jobId: string): Promise<void> {
  const redis = await getRedis();
  try {
    await redis.sadd(`UPLOAD_JOBS:${uploadId}`, jobId);
  } finally {
    redisPool.release(redis);
  }
}

export async function completeJob(uploadId: string, jobId: string): Promise<boolean> {
  const redis = await getRedis();
  try {
    // Remove job from upload tracking
    const remainingJobs = await redis.srem(`UPLOAD_JOBS:${uploadId}`, jobId);
    
    // If no more jobs, clean up upload tracking
    if (remainingJobs === 0) {
      // Get userId before cleaning up
      const status = await getJobStatus(jobId);
      if (status?.userId) {
        // Remove user from active set and clean up upload tracking
        await Promise.all([
          redis.srem(ACTIVE_USERS_SET, status.userId),
          redis.del(`UPLOAD_JOBS:${uploadId}`)
        ]);
      } else {
        await redis.del(`UPLOAD_JOBS:${uploadId}`);
      }
      return true;
    }
    return false;
  } finally {
    redisPool.release(redis);
  }
}

export async function getUploadStatus(userId: string): Promise<string | null> {
  const redis = await getRedis();
  try {
    return await redis.get(`UPLOAD_STATUS:${userId}`);
  } finally {
    redisPool.release(redis);
  }
}

export async function cleanupStaleUploads(): Promise<void> {
  const redis = await getRedis();
  try {
    // Get all active uploads
    const keys = await redis.keys('UPLOAD_STATUS:*');
    
    for (const key of keys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1 || ttl === -2) {
        const userId = key.replace('UPLOAD_STATUS:', '');
        const uploadId = await redis.get(key);
        
        if (uploadId) {
          await redis.del(`UPLOAD_JOBS:${uploadId}`);
        }
        await redis.del(key);
      }
    }
  } finally {
    redisPool.release(redis);
  }
}