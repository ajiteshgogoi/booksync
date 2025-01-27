import { jobStateService, type JobMetadata } from './jobStateService.js';
import { logger } from '../utils/logger.js';
import {
  uploadObject,
  deleteObject,
  listObjects,
  downloadObject,
  getObjectInfo
} from './r2Service.js';

const ACTIVE_USERS_PREFIX = 'active-users/';
const UPLOADS_PREFIX = 'uploads/';
const JOB_STATE_PREFIX = 'jobs/';
const LOCK_TIMEOUT = 30000; // 30 seconds
const LOCK_FILE_PREFIX = 'locks/';
const UPLOAD_EXPIRY = 15 * 60 * 1000; // 15 minutes

interface Lock {
  lockedBy: string;
  acquiredAt: number;
  expiresAt: number;
}

export interface UserState {
  hasActiveUploads: boolean;
  hasActiveJobs: boolean;
}

/**
 * Unified cleanup service that handles both upload and job cleanup
 * while maintaining consistency of the active users set in R2
 */
export class CleanupService {
  private static readonly ACTIVE_STATES = ['pending', 'processing', 'queued'];
  private static workerId: string = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  private static async acquireLock(resource: string): Promise<boolean> {
    const lockFile = `${LOCK_FILE_PREFIX}${resource}-lock.json`;
    const now = Date.now();
    const lock: Lock = {
      lockedBy: this.workerId,
      acquiredAt: now,
      expiresAt: now + LOCK_TIMEOUT
    };

    try {
      await uploadObject(lockFile, JSON.stringify(lock));
      return true;
    } catch (error) {
      // If file already exists, check if lock is expired
      try {
        const existingLock = JSON.parse(await downloadObject(lockFile).then(b => b.toString())) as Lock;
        if (existingLock.expiresAt < now) {
          // Lock is expired, try to acquire it
          await uploadObject(lockFile, JSON.stringify(lock));
          return true;
        }
      } catch (error) {
        logger.error('Error checking existing lock:', error);
      }
      return false;
    }
  }

  private static async releaseLock(resource: string): Promise<void> {
    const lockFile = `${LOCK_FILE_PREFIX}${resource}-lock.json`;
    try {
      // Delete the lock file
      await deleteObject(lockFile);
    } catch (error) {
      logger.error('Error releasing lock:', error);
    }
  }

  /**
   * Get all users currently marked as active in R2
   */
  private static async getActiveUsers(): Promise<string[]> {
    if (!await this.acquireLock('active-users')) {
      throw new Error('Could not acquire active users lock');
    }

    try {
      const activeUsers: string[] = [];
      const objects = await listObjects(ACTIVE_USERS_PREFIX);
      if (objects) {
        for (const obj of objects) {
          if (obj.key) {
            const userId = obj.key.replace(ACTIVE_USERS_PREFIX, '').replace('.json', '');
            activeUsers.push(userId);
          }
        }
      }
      return activeUsers;
    } finally {
      await this.releaseLock('active-users');
    }
  }

  /**
   * Check if user has any active uploads in R2
   */
  private static async checkUserUploads(userId: string): Promise<boolean> {
    try {
      const uploadKey = `${UPLOADS_PREFIX}${userId}.json`;
      const uploadData = await downloadObject(uploadKey);
      if (uploadData) {
        // If upload exists, it's considered active
        return true;
      }
    } catch (error) {
      // If object doesn't exist or any other error, consider it inactive
      logger.debug(`No active upload found for user ${userId}`);
    }
    return false;
  }

  /**
   * Clean up unqueued upload files that are older than 15 minutes
   */
  private static async cleanupStaleUploads(): Promise<void> {
    if (!await this.acquireLock('uploads')) {
      throw new Error('Could not acquire uploads lock');
    }

    try {
      // List all .txt files in root (these are uploaded files not yet moved to temp storage)
      const objects = await listObjects('.txt');
      if (!objects) return;

      const now = Date.now();
      let removedCount = 0;

      for (const obj of objects) {
        if (!obj.key) continue;

        // Get file metadata including lastModified
        const info = await getObjectInfo(obj.key);
        if (!info?.lastModified) continue;

        // Skip if not old enough
        if (now - info.lastModified.getTime() < UPLOAD_EXPIRY) continue;

        // Extract jobId from filename
        const jobId = obj.key.replace('.txt', '');

        // Check if job exists and is queued
        const jobState = await jobStateService.getJobState(jobId);
        if (!jobState || !['queued', 'processing', 'parsed'].includes(jobState.state)) {
          await deleteObject(obj.key);
          logger.info(`Removed stale upload file: ${obj.key}`);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        logger.info(`Cleaned up ${removedCount} stale upload files`);
      }
    } catch (error) {
      logger.error('Error cleaning up stale uploads:', error);
    } finally {
      await this.releaseLock('uploads');
    }
  }

  /**
   * Check if user has any active jobs
   */
  private static async checkUserJobs(userId: string): Promise<boolean> {
    const userJobs = await jobStateService.listJobsByUser(userId);
    return userJobs.some(job => this.ACTIVE_STATES.includes(job.state));
  }

  /**
   * Clean up user's upload key in R2
   */
  private static async cleanupUserUploads(userId: string): Promise<void> {
    if (!await this.acquireLock('uploads')) {
      throw new Error('Could not acquire uploads lock');
    }

    try {
      const uploadKey = `${UPLOADS_PREFIX}${userId}.json`;
      await deleteObject(uploadKey);
      logger.info(`Cleaned up upload for user ${userId}`);
    } catch (error) {
      logger.error(`Error cleaning up uploads for user ${userId}:`, error);
    } finally {
      await this.releaseLock('uploads');
    }
  }

  /**
   * Clean up expired job statuses using jobStateService
   */
  private static async cleanupStaleJobs(): Promise<void> {
    if (!await this.acquireLock('jobs')) {
      throw new Error('Could not acquire jobs lock');
    }

    try {
      const allJobs = await jobStateService.listAllJobs();
      const now = Date.now();
      const expiredJobs = allJobs.filter((job: JobMetadata) => {
        return jobStateService.isTerminalState(job.state) &&
               now - job.updatedAt > 86400000; // 24 hours
      });

      for (const job of expiredJobs) {
        await jobStateService.deleteJob(job.jobId);
        logger.debug(`Removed expired job: ${job.jobId}`);
      }
    } catch (error) {
      logger.error('Error cleaning up stale jobs:', error);
    } finally {
      await this.releaseLock('jobs');
    }
  }

  /**
   * Update user's active status in R2 based on current state
   */
  public static async updateUserActiveStatus(
    userId: string,
    state: UserState
  ): Promise<void> {
    if (!await this.acquireLock('active-users')) {
      throw new Error('Could not acquire active users lock');
    }

    try {
      const activeUserKey = `${ACTIVE_USERS_PREFIX}${userId}.json`;
      if (state.hasActiveUploads || state.hasActiveJobs) {
        // Add user to active set
        await uploadObject(activeUserKey, JSON.stringify({ active: true }));
        logger.debug(`User ${userId} marked as active`);
      } else {
        // Remove user from active set
        await deleteObject(activeUserKey);
        logger.info(`Removed inactive user ${userId} from active set`);
      }
    } finally {
      await this.releaseLock('active-users');
    }
  }

  /**
   * Health check to verify active users set consistency
   */
  private static async verifyActiveUsersSetConsistency(): Promise<void> {
    if (!await this.acquireLock('active-users')) {
      throw new Error('Could not acquire active users lock');
    }

    try {
      const activeUsers = await this.getActiveUsers();
      for (const userId of activeUsers) {
        const [hasActiveUploads, hasActiveJobs] = await Promise.all([
          this.checkUserUploads(userId),
          this.checkUserJobs(userId)
        ]);

        if (!hasActiveUploads && !hasActiveJobs) {
          // User found in active set but has no active work
          await deleteObject(`${ACTIVE_USERS_PREFIX}${userId}.json`);
          logger.warn(`Health check: Removed user ${userId} from active set (no active work found)`);
        }
      }
    } catch (error) {
      logger.error('Error in active users set health check:', error);
    } finally {
      await this.releaseLock('active-users');
    }
  }

  /**
   * Main cleanup method that coordinates the entire cleanup process
   */
  public static async cleanup(): Promise<void> {
    const startTime = Date.now();
    logger.info('Starting unified cleanup process');

    try {
      // Clean up stale uploads first
      await this.cleanupStaleUploads();
      logger.info('Stale uploads cleanup completed');

      // Run health check
      await this.verifyActiveUsersSetConsistency();
      logger.info('Active users set health check completed');

      // Clean up expired jobs
      await this.cleanupStaleJobs();
      logger.info('Stale jobs cleanup completed');

      // Process active users
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
