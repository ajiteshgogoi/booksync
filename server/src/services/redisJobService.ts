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

export async function addJobToQueue(jobId: string, userId: string): Promise<void> {
  const redis = await getRedis();
  try {
    // Check if user is in active users set
    const isActive = await redis.sismember(ACTIVE_USERS_SET, userId);
    if (isActive) {
      throw new Error('User already has an active file processing job');
    }

    // Add job to stream and mark user as active
    await redis.multi()
      .xadd(STREAM_NAME, '*', 'jobId', jobId, 'userId', userId)
      .sadd(ACTIVE_USERS_SET, userId)
      .exec();
      
    await setJobStatus(jobId, { 
      state: 'pending',
      userId 
    });
  } catch (error) {
    // Clean up if something went wrong
    await redis.srem(ACTIVE_USERS_SET, userId);
    throw error;
  } finally {
    redisPool.release(redis);
  }
}

export async function completeJob(jobId: string, messageId: string): Promise<void> {
  const redis = await getRedis();
  try {
    const status = await getJobStatus(jobId);
    if (!status?.userId) {
      throw new Error('Cannot complete job: userId not found');
    }

    await redis.multi()
      .xack(STREAM_NAME, CONSUMER_GROUP, messageId)
      .srem(ACTIVE_USERS_SET, status.userId)
      .exec();
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