import { getRedis, redisPool, setJobStatus, getJobStatus, hasUserPendingJob } from './redisService.js';
import type { JobStatus } from '../types/job.js';
import {
  STREAM_NAME,
  CONSUMER_GROUP,
  CONSUMER_NAME,
  JOB_TTL,
  ACTIVE_USERS_SET
} from './redisService.js';

type RedisStreamMessage = [id: string, fields: string[]];

import { startUpload, addJobToUpload } from './uploadTrackingService.js';

export async function addJobToQueue(jobId: string, userId: string, uploadId?: string): Promise<void> {
  const redis = await getRedis();
  try {
    if (!uploadId) {
      // Single job upload
      await startUpload(userId, jobId);
    }

    // Add job to stream
    await redis.xadd(
      STREAM_NAME,
      '*',
      'jobId', jobId,
      'userId', userId,
      'uploadId', uploadId || jobId
    );

    if (uploadId) {
      // Add job to upload tracking
      await addJobToUpload(uploadId, jobId);
    }

    await setJobStatus(jobId, {
      state: 'pending',
      userId,
      uploadId: uploadId || jobId
    });
  } catch (error) {
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

import { completeJob as completeUploadJob } from './uploadTrackingService.js';

export async function completeJob(jobId: string, messageId: string): Promise<void> {
  const redis = await getRedis();
  try {
    const status = await getJobStatus(jobId);
    if (!status?.userId) {
      throw new Error('Cannot complete job: userId not found');
    }

    // Acknowledge the job in the stream
    await redis.xack(STREAM_NAME, CONSUMER_GROUP, messageId);

    // Handle upload tracking if this is part of an upload
    if (status.uploadId) {
      const uploadComplete = await completeUploadJob(status.uploadId, jobId);
      if (uploadComplete) {
        await redis.del(`UPLOAD_STATUS:${status.userId}`);
      }
    }
    
    // For both single jobs and multi-job uploads, ensure user is removed from active set
    // if they have no more pending jobs
    const hasPendingJob = await hasUserPendingJob(status.userId);
    if (!hasPendingJob) {
      const redis = await getRedis();
      try {
        await redis.srem(ACTIVE_USERS_SET, status.userId);
      } finally {
        redisPool.release(redis);
      }
    }
  } finally {
    redisPool.release(redis);
  }
}

// Re-export types and constants from redisService
export type { JobStatus };
export {
  STREAM_NAME,
  CONSUMER_GROUP,
  CONSUMER_NAME,
  JOB_TTL,
  ACTIVE_USERS_SET
};