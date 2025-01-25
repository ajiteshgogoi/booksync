import { getRedis, redisPool, setJobStatus, getJobStatus } from './redisService.js';
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
    } else {
      // Single job upload
      await redis.del(`UPLOAD_STATUS:${status.userId}`);
    }
  } finally {
    redisPool.release(redis);
  }
}

export async function cleanupStaleJobs(): Promise<void> {
  const redis = await getRedis();
  try {
    // Get all active users
    const activeUsers = await redis.smembers(ACTIVE_USERS_SET);
    
    // Check each user's job status
    for (const userId of activeUsers) {
      const jobs = await redis.xread('STREAMS', STREAM_NAME, '0-0');
      if (!jobs || jobs.length === 0) continue;

      const streamMessages = jobs[0][1];
      if (!streamMessages || streamMessages.length === 0) continue;

      // Find user's active jobs
      const activeJobs = streamMessages.filter(([_, fields]) => {
        const userIdIndex = fields.indexOf('userId');
        return userIdIndex !== -1 &&
               fields[userIdIndex + 1] === userId;
      });

      // If no active jobs, remove from set
      if (activeJobs.length === 0) {
        await redis.srem(ACTIVE_USERS_SET, userId);
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