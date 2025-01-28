import { logger } from '../utils/logger.js';
import { uploadObject, downloadObject, deleteObject } from './r2Service.js';
import { jobStateService } from './jobStateService.js';

const LOCK_TIMEOUT = 30000; // 30 seconds
const MAX_ACTIVE_USERS = 18; // Maximum concurrent active users
const LOCK_FILE_PREFIX = 'locks/';
const QUEUE_FILE = 'queue/upload-queue.json';
const ACTIVE_USERS_FILE = 'queue/active-users.json';

interface Lock {
  lockedBy: string;
  acquiredAt: number;
  expiresAt: number;
}

interface QueueEntry {
  uploadId: string;  // Correctly represents job ID with sync: prefix
  userId: string;
  queuedAt: number;
}

interface ActiveUser {
  uploadId: string;
  startedAt: number;
}

interface QueueState {
  queue: QueueEntry[];
}

interface ActiveUsersState {
  activeUsers: Record<string, ActiveUser>;
  queueLength: number;
}

export class QueueService {
  private isChunkJob(jobId: string): boolean {
    // Check if job ID has chunk suffix (_N)
    return jobId.includes('_');
  }

  public getBaseJobId(jobId: string): string {
    // First remove any prefix (sync: or upload:)
    const withoutPrefix = jobId.replace(/^(sync:|upload:)/, '');
    // Then remove the chunk suffix if present
    return withoutPrefix.split('_')[0];
  }

  private static instance: QueueService;
  private workerId: string;

  private constructor() {
    this.workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  private async acquireLock(resource: string): Promise<boolean> {
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

  private async releaseLock(resource: string): Promise<void> {
    const lockFile = `${LOCK_FILE_PREFIX}${resource}-lock.json`;
    try {
      // Properly delete the lock file instead of uploading empty content
      await deleteObject(lockFile);
    } catch (error) {
      // Ignore NotFound errors when trying to delete the lock
      if ((error as any)?.name !== 'NotFound') {
        logger.error('Error releasing lock:', error);
      }
    }
  }

  async getQueueState(): Promise<QueueState> {
    try {
      const data = await downloadObject(QUEUE_FILE);
      const state = JSON.parse(data.toString()) as QueueState;
      logger.debug('Got queue state:', {
        queueLength: state.queue.length,
        jobs: state.queue.map((entry: QueueEntry) => ({
          jobId: entry.uploadId,
          userId: entry.userId,
          queuedAt: new Date(entry.queuedAt).toISOString()
        }))
      });
      return state;
    } catch (error) {
      logger.debug('Queue file not found, returning empty queue');
      return { queue: [] };
    }
  }

  private async getActiveUsersState(): Promise<ActiveUsersState> {
    try {
      const data = await downloadObject(ACTIVE_USERS_FILE);
      return JSON.parse(data.toString());
    } catch (error) {
      // If file doesn't exist, return empty state
      return { activeUsers: {}, queueLength: 0 };
    }
  }

  async addToQueue(uploadId: string, userId: string): Promise<boolean> {
    // Validate job state before attempting to acquire lock
    const jobState = await jobStateService.getJobState(uploadId);
    if (!jobState) {
      logger.error('Job state not found when adding to queue', { uploadId });
      return false;
    }

    // Multiple attempts to acquire lock
    let acquired = false;
    for (let i = 0; i < 3; i++) {
      try {
        acquired = await this.acquireLock('queue');
        if (acquired) break;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i))); // Exponential backoff
      } catch (error) {
        logger.error('Error acquiring queue lock (attempt ' + (i + 1) + '):', error);
      }
    }

    if (!acquired) {
      throw new Error('Could not acquire queue lock after multiple attempts');
    }

    try {
      const queueState = await this.getQueueState();
      const activeState = await this.getActiveUsersState();

      // Initialize queue and active users if they don't exist
      if (!queueState.queue) queueState.queue = [];
      if (!activeState.activeUsers) activeState.activeUsers = {};

      let canAdd = true;

      // For chunk jobs
      if (jobState.isChunk && jobState.parentUploadId) {
        const baseUploadId = this.getBaseJobId(jobState.parentUploadId);
        const activeBaseId = activeState.activeUsers[userId]?.uploadId;
        const uploadStatus = await jobStateService.getChunkedUploadStatus(baseUploadId);

        // Only block if upload is complete or user has different active upload
        if (uploadStatus.isComplete) {
          logger.debug('Chunk rejected - parent upload already complete', {
            jobId: uploadId,
            parentUploadId: baseUploadId
          });
          canAdd = false;
        } else if (activeBaseId && this.getBaseJobId(activeBaseId) !== baseUploadId) {
          logger.debug('Chunk rejected - user has different active upload', {
            userId,
            activeUpload: activeBaseId,
            requestedUpload: baseUploadId
          });
          canAdd = false;
        }
      } else {
        // For new uploads
        const hasExistingUpload = activeState.activeUsers[userId] ||
                                queueState.queue.some(e => e.userId === userId && !this.isChunkJob(e.uploadId));
        if (hasExistingUpload) {
          logger.debug('New upload rejected - user has existing upload', {
            userId,
            activeUpload: activeState.activeUsers[userId]?.uploadId
          });
          canAdd = false;
        }
      }

      if (!canAdd) {
        return false;
      }

      // Prepare queue entry
      const entry = {
        uploadId,
        userId,
        queuedAt: Date.now()
      };

      // Try to update queue state with retries
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!success && attempts < maxAttempts) {
        try {
          // Add to queue
          queueState.queue.push(entry);
          
          logger.debug('Attempting to update queue state (attempt ' + (attempts + 1) + '):', {
            jobId: uploadId,
            isChunk: this.isChunkJob(uploadId),
            userId,
            queueLength: queueState.queue.length
          });

          // Update both states atomically
          await Promise.all([
            uploadObject(QUEUE_FILE, JSON.stringify(queueState)),
            uploadObject(ACTIVE_USERS_FILE, JSON.stringify({
              ...activeState,
              queueLength: queueState.queue.length
            }))
          ]);

          success = true;
          logger.debug('Successfully updated queue state', {
            jobId: uploadId,
            queueLength: queueState.queue.length
          });
        } catch (error) {
          attempts++;
          logger.error('Failed to update queue state (attempt ' + attempts + ')', {
            error,
            jobId: uploadId
          });
          
          if (attempts < maxAttempts) {
            // Remove failed entry and retry
            queueState.queue = queueState.queue.filter(e => e.uploadId !== uploadId);
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)));
          }
        }
      }

      return success;
    } finally {
      await this.releaseLock('queue');
    }
  }

  async getNextJob(): Promise<QueueEntry | null> {
    if (!await this.acquireLock('queue')) {
      throw new Error('Could not acquire queue lock');
    }

    try {
      // First check active users since it's a quick operation
      const activeState = await this.getActiveUsersState();
      if (Object.keys(activeState.activeUsers).length >= MAX_ACTIVE_USERS) {
        return null;
      }

      // Only get queue state if we have room for more active users
      const queueState = await this.getQueueState();
      logger.debug('Checking queue state in moveToActive:', {
        queueLength: queueState.queue.length,
        activeUsers: Object.keys(activeState.activeUsers).length
      });

      if (queueState.queue.length === 0) {
        logger.debug('No jobs in queue');
        return null;
      }

      // Find next eligible job - one that meets all criteria
      let eligibleJob = null;
      for (const entry of queueState.queue) {
        // Only process jobs with sync: prefix
        if (!entry.uploadId.startsWith('sync:')) {
          logger.debug('Skipping non-sync job', { jobId: entry.uploadId });
          continue;
        }

        // Verify job exists in job state service
        const jobState = await jobStateService.getJobState(entry.uploadId);
        if (!jobState) {
          logger.error('Job not found in job state service', { jobId: entry.uploadId });
          continue;
        }

        // Check if this is a chunk job
        if (this.isChunkJob(entry.uploadId)) {
          // First check if user has any active jobs
          const hasActiveChunk = activeState.activeUsers[entry.userId];
          if (hasActiveChunk) {
            // Ensure both IDs have sync: prefix when getting base ID
            const activeBaseId = this.getBaseJobId(`sync:${activeState.activeUsers[entry.userId].uploadId}`);
            const incomingBaseId = this.getBaseJobId(entry.uploadId);
            
            // Only skip if it's for the same base upload
            if (activeBaseId === incomingBaseId) {
              logger.debug('User already has active chunk for this upload, skipping chunk job', {
                userId: entry.userId,
                activeJob: activeState.activeUsers[entry.userId].uploadId,
                nextJobId: entry.uploadId,
                activeBaseId,
                incomingBaseId
              });
              continue;
            }
          }
        }

        // Skip failed jobs
        if (jobState.state === 'failed') {
          logger.debug('Skipping failed job', { jobId: entry.uploadId });
          continue;
        }

        // Found an eligible job
        eligibleJob = entry;
        break;
      }

      if (!eligibleJob) {
        logger.debug('No eligible jobs found in queue');
        return null;
      }

      logger.debug('Found next eligible job in queue:', {
        jobId: eligibleJob.uploadId,
        userId: eligibleJob.userId,
        queuedAt: new Date(eligibleJob.queuedAt).toISOString()
      });

      const jobState = await jobStateService.getJobState(eligibleJob.uploadId);

      if (!jobState) {
        logger.error('Job state unexpectedly null for eligible job', {
          jobId: eligibleJob.uploadId
        });
        return null;
      }

      logger.debug('Found valid job in queue:', {
        jobId: eligibleJob.uploadId,
        state: jobState.state
      });

      // Return the eligible job without removing it from queue
      return eligibleJob;
    } finally {
      await this.releaseLock('queue');
    }
  }

  async removeFromQueue(jobId: string): Promise<void> {
    if (!await this.acquireLock('queue')) {
      throw new Error('Could not acquire queue lock');
    }

    try {
      const queueState = await this.getQueueState();
      const activeState = await this.getActiveUsersState();

      // Remove the job from queue
      const index = queueState.queue.findIndex(entry => entry.uploadId === jobId);
      if (index !== -1) {
        queueState.queue.splice(index, 1);
        await uploadObject(QUEUE_FILE, JSON.stringify(queueState));
        
        // Update queue length
        activeState.queueLength = queueState.queue.length;
        await uploadObject(ACTIVE_USERS_FILE, JSON.stringify(activeState));
        
        logger.debug('Removed job from queue', { jobId });
      }
    } finally {
      await this.releaseLock('queue');
    }
  }

  async removeFromActive(userId: string): Promise<void> {
    if (!await this.acquireLock('queue')) {
      throw new Error('Could not acquire queue lock');
    }

    try {
      const activeState = await this.getActiveUsersState();
      const queueState = await this.getQueueState();

      // Get the base upload ID for this user
      const baseUploadId = activeState.activeUsers[userId]?.uploadId;
      if (baseUploadId) {
        // Only remove if no more chunks from this upload are in queue
        const hasMoreChunks = queueState.queue.some(entry => {
          const queuedBaseId = this.getBaseJobId(entry.uploadId);
          const activeBaseId = this.getBaseJobId(baseUploadId);
          return queuedBaseId === activeBaseId;
        });

        if (!hasMoreChunks) {
          // No more chunks in queue, safe to remove from active users
          delete activeState.activeUsers[userId];
          logger.debug('Removed user from active users - no more chunks in queue', {
            userId,
            baseUploadId
          });
        } else {
          logger.debug('Keeping user in active users - more chunks in queue', {
            userId,
            baseUploadId,
            queuedChunks: queueState.queue.filter(entry =>
              this.getBaseJobId(entry.uploadId) === baseUploadId
            ).length
          });
        }
      }

      // Update queue length
      activeState.queueLength = queueState.queue.length;
      await uploadObject(ACTIVE_USERS_FILE, JSON.stringify(activeState));
    } finally {
      await this.releaseLock('queue');
    }
  }

  async getQueuePosition(userId: string): Promise<number> {
    const queueState = await this.getQueueState();
    const position = queueState.queue.findIndex(entry => entry.userId === userId);
    return position === -1 ? -1 : position + 1;
  }

  async isUserActive(userId: string): Promise<boolean> {
    const activeState = await this.getActiveUsersState();
    
    // Check if user has any jobs in parsed state
    const queueState = await this.getQueueState();
    const hasQueuedJobs = queueState.queue.some(entry => entry.userId === userId);
    
    return !!activeState.activeUsers[userId] || hasQueuedJobs;
  }

  async addToActiveUsers(userId: string, uploadId: string): Promise<void> {
    if (!await this.acquireLock('queue')) {
      throw new Error('Could not acquire queue lock');
    }

    try {
      const activeState = await this.getActiveUsersState();
      if (!activeState.activeUsers[userId]) {
        // Always add with sync: prefix to match incoming job IDs
        activeState.activeUsers[userId] = {
          uploadId: `sync:${this.getBaseJobId(uploadId)}`,
          startedAt: Date.now()
        };
        await uploadObject(ACTIVE_USERS_FILE, JSON.stringify(activeState));
      }
    } finally {
      await this.releaseLock('queue');
    }
  }

  async getQueueLength(): Promise<number> {
    // Get actual queue length instead of cached value
    const queueState = await this.getQueueState();
    return queueState.queue.length;
  }

  async getActiveUserCount(): Promise<number> {
    const activeState = await this.getActiveUsersState();
    return Object.keys(activeState.activeUsers).length;
  }
}

export const queueService = QueueService.getInstance();