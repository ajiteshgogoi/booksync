import { jobStateService, type JobMetadata } from './jobStateService.js';
import { queueService } from './queueService.js';
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
  
  // Processing jobs get 6 hours before considered stuck
  private static readonly STUCK_JOB_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours
  
  // Completed/failed jobs only need 5 minutes retention
  private static readonly COMPLETED_JOB_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  
  // Files older than 24 hours are considered stale
  private static readonly UPLOAD_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

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
      // List all upload files (including in subdirectories)
      const objects = await listObjects('uploads/');
      if (!objects) return;

      const now = Date.now();
      let removedCount = 0;
      const processedIds = new Set<string>();

      for (const obj of objects) {
        if (!obj.key || !obj.key.endsWith('.txt')) continue;

        // Get file metadata including lastModified
        const info = await getObjectInfo(obj.key);
        if (!info?.lastModified) continue;

        // Check if file is older than timeout
        if (now - info.lastModified.getTime() < this.UPLOAD_EXPIRY) continue;

        // Extract jobId from filename (handles both chunks and regular uploads)
        const jobId = obj.key.replace('uploads/', '').replace('.txt', '');
        
        // Get job state
        const jobState = await jobStateService.getJobState(jobId);
        
        if (!jobState) {
          // If no job state exists, safe to remove
          await deleteObject(obj.key);
          logger.info(`Removed orphaned upload file: ${obj.key}`);
          removedCount++;
          continue;
        }

        // For chunk jobs, only clean up if parent is processed or stale
        if (jobState.isChunk && jobState.parentUploadId) {
          // Skip if we've already processed this parent
          if (processedIds.has(jobState.parentUploadId)) continue;

          const parentJob = await jobStateService.getJobState(jobState.parentUploadId);
          
          // Get all jobs associated with this upload
          const chunkJobs = await jobStateService.getChunkJobs(jobState.parentUploadId);
          
          // Check if any chunks are queued
          const queueState = await queueService.getQueueState();
          const hasQueuedChunks = queueState.queue.some(entry =>
            chunkJobs.some(chunk => queueService.getBaseJobId(chunk.jobId) === queueService.getBaseJobId(entry.uploadId))
          );

          if (hasQueuedChunks) {
            logger.debug('Skipping cleanup - chunks still in queue', {
              parentUploadId: jobState.parentUploadId
            });
            continue;
          }

          if (!parentJob) {
            // Parent missing and no queued chunks, clean up all chunks
            for (const chunk of chunkJobs) {
              await deleteObject(`uploads/${chunk.jobId}.txt`);
              removedCount++;
            }
            processedIds.add(jobState.parentUploadId);
          } else if (parentJob.state === 'pending' || this.isJobStale(parentJob)) {
            // Parent is stale or pending and no queued chunks, clean up all chunks
            for (const chunk of chunkJobs) {
              await deleteObject(`uploads/${chunk.jobId}.txt`);
              removedCount++;
            }
            await deleteObject(`uploads/${parentJob.jobId}.txt`);
            removedCount++;
            processedIds.add(jobState.parentUploadId);
          }
        } else if (jobState.state === 'pending' || this.isJobStale(jobState)) {
          // For non-chunk jobs, clean up if pending or stale
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
   * Check if user has any active jobs, including chunked uploads
   */
  private static async checkUserJobs(userId: string): Promise<boolean> {
    const userJobs = await jobStateService.listJobsByUser(userId);
    
    // Group jobs by parent upload to check chunked uploads
    const jobsByUpload: { [key: string]: JobMetadata[] } = {};
    for (const job of userJobs) {
      if (job.parentUploadId) {
        jobsByUpload[job.parentUploadId] = jobsByUpload[job.parentUploadId] || [];
        jobsByUpload[job.parentUploadId].push(job);
      }
    }

    // Check non-chunked jobs
    const hasActiveRegularJobs = userJobs
      .filter(job => !job.isChunk)
      .some(job => this.ACTIVE_STATES.includes(job.state));

    if (hasActiveRegularJobs) {
      return true;
    }

    // Check chunked uploads
    for (const uploadId of Object.keys(jobsByUpload)) {
      const uploadStatus = await jobStateService.getChunkedUploadStatus(uploadId);
      if (!uploadStatus.isComplete) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clean up user's upload key in R2 after verifying all chunks are complete
   */
  private static async cleanupUserUploads(userId: string): Promise<void> {
    if (!await this.acquireLock('uploads')) {
      throw new Error('Could not acquire uploads lock');
    }

    try {
      const userJobs = await jobStateService.listJobsByUser(userId);
      const uploadIds = new Set(userJobs
        .filter(job => job.parentUploadId)
        .map(job => job.parentUploadId));

      // Verify all chunked uploads are complete
      for (const uploadId of uploadIds) {
        const status = await jobStateService.getChunkedUploadStatus(uploadId!);
        if (!status.isComplete) {
          logger.warn(`Skipping cleanup - incomplete chunks for upload ${uploadId}`);
          return;
        }
      }

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
  private static isJobStale(job: JobMetadata): boolean {
    const now = Date.now();
    
    // For chunk jobs, check parent status first
    if (job.isChunk && job.parentUploadId) {
      return false; // Will be handled when parent is cleaned up
    }

    if (job.state === 'completed' || job.state === 'failed') {
      return now - job.updatedAt > this.COMPLETED_JOB_TIMEOUT;
    }

    if (job.state === 'processing') {
      return now - job.updatedAt > this.STUCK_JOB_TIMEOUT;
    }

    return false;
  }

  private static async cleanupJobResources(job: JobMetadata): Promise<void> {
    try {
      // Clean up job temp files
      await deleteObject(`temp-highlights/${job.jobId}.json`);
      await deleteObject(`uploads/${job.jobId}.txt`);
      
      // For parent jobs, also clean up all chunk resources
      if (!job.isChunk && job.jobId) {
        const chunkJobs = await jobStateService.getChunkJobs(job.jobId);
        for (const chunk of chunkJobs) {
          await deleteObject(`temp-highlights/${chunk.jobId}.json`);
          await deleteObject(`uploads/${chunk.jobId}.txt`);
          await jobStateService.deleteJob(chunk.jobId);
        }
      }

      // Clean up job state last
      await jobStateService.deleteJob(job.jobId);
      
      logger.info('Cleaned up stale job resources', {
        jobId: job.jobId,
        state: job.state,
        isChunk: job.isChunk,
        parentUploadId: job.parentUploadId,
        age: Date.now() - job.updatedAt
      });
    } catch (error) {
      logger.error('Error cleaning up job resources', {
        jobId: job.jobId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private static async cleanupStaleJobs(): Promise<void> {
    if (!await this.acquireLock('jobs')) {
      throw new Error('Could not acquire jobs lock');
    }

    try {
      const allJobs = await jobStateService.listAllJobs();
      let cleanedCount = 0;

      // First pass: Clean up completed/failed jobs and stuck processing jobs
      for (const job of allJobs) {
        if (!this.isJobStale(job)) continue;
        
        if (!job.isChunk) {
          // For parent jobs or standalone jobs
          await this.cleanupJobResources(job);
          cleanedCount++;
        }
      }

      // Second pass: Clean up stale chunks
      for (const job of allJobs) {
        if (!job.isChunk || !job.parentUploadId) continue;

        const parent = allJobs.find(j => j.jobId === job.parentUploadId);
        if (!parent || this.isJobStale(parent)) {
          await this.cleanupJobResources(job);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} stale jobs`);
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
