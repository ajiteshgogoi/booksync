import { getRedis, redisPool } from './redisService.js';

export class WorkerStateService {
  // Redis key names for state tracking
  private static readonly UPLOAD_QUEUE_KEY = 'worker:upload_queue'; // Sorted set with score as timestamp
  private static readonly PROCESSING_UPLOAD_KEY = 'worker:processing_upload'; // String with upload ID
  private static readonly ACTIVE_USER_UPLOADS_KEY = 'worker:active_user_uploads'; // Hash of userId -> uploadId
  private static readonly STATE_TTL = 60 * 60 * 24; // 24 hour TTL for state keys

  async isUploadProcessing(): Promise<boolean> {
    const redis = await getRedis();
    try {
      return await redis.exists(WorkerStateService.PROCESSING_UPLOAD_KEY) === 1;
    } finally {
      redisPool.release(redis);
    }
  }

  async getCurrentProcessingUpload(): Promise<string | null> {
    const redis = await getRedis();
    try {
      return await redis.get(WorkerStateService.PROCESSING_UPLOAD_KEY);
    } finally {
      redisPool.release(redis);
    }
  }

  async setProcessingUpload(uploadId: string | null): Promise<void> {
    const redis = await getRedis();
    try {
      if (uploadId) {
        await redis.set(
          WorkerStateService.PROCESSING_UPLOAD_KEY, 
          uploadId,
          'EX',
          WorkerStateService.STATE_TTL
        );
      } else {
        await redis.del(WorkerStateService.PROCESSING_UPLOAD_KEY);
      }
    } finally {
      redisPool.release(redis);
    }
  }

  async addToUploadQueue(uploadId: string): Promise<void> {
    const redis = await getRedis();
    try {
      await redis.zadd(
        WorkerStateService.UPLOAD_QUEUE_KEY,
        Date.now(),
        uploadId
      );
      await redis.expire(WorkerStateService.UPLOAD_QUEUE_KEY, WorkerStateService.STATE_TTL);
    } finally {
      redisPool.release(redis);
    }
  }

  async getUploadQueueLength(): Promise<number> {
    const redis = await getRedis();
    try {
      return await redis.zcard(WorkerStateService.UPLOAD_QUEUE_KEY);
    } finally {
      redisPool.release(redis);
    }
  }

  async isInUploadQueue(uploadId: string): Promise<boolean> {
    const redis = await getRedis();
    try {
      return await redis.zscore(WorkerStateService.UPLOAD_QUEUE_KEY, uploadId) !== null;
    } finally {
      redisPool.release(redis);
    }
  }

  async removeFromUploadQueue(uploadId: string): Promise<void> {
    const redis = await getRedis();
    try {
      await redis.zrem(WorkerStateService.UPLOAD_QUEUE_KEY, uploadId);
    } finally {
      redisPool.release(redis);
    }
  }

  async getActiveUserUpload(userId: string): Promise<string | null> {
    const redis = await getRedis();
    try {
      return await redis.hget(WorkerStateService.ACTIVE_USER_UPLOADS_KEY, userId);
    } finally {
      redisPool.release(redis);
    }
  }

  async setActiveUserUpload(userId: string, uploadId: string): Promise<void> {
    const redis = await getRedis();
    try {
      await redis.hset(WorkerStateService.ACTIVE_USER_UPLOADS_KEY, userId, uploadId);
      await redis.expire(WorkerStateService.ACTIVE_USER_UPLOADS_KEY, WorkerStateService.STATE_TTL);
    } finally {
      redisPool.release(redis);
    }
  }

  async removeActiveUserUpload(userId: string): Promise<void> {
    const redis = await getRedis();
    try {
      await redis.hdel(WorkerStateService.ACTIVE_USER_UPLOADS_KEY, userId);
    } finally {
      redisPool.release(redis);
    }
  }
}

// Create singleton instance
export const workerStateService = new WorkerStateService();