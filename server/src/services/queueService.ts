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

  private getBaseJobId(jobId: string): string {
    // Remove chunk suffix if present
    return jobId.split('_')[0];
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

  private async getQueueState(): Promise<QueueState> {
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
    if (!await this.acquireLock('queue')) {
      throw new Error('Could not acquire queue lock');
    }

    try {
      const queueState = await this.getQueueState();
      const activeState = await this.getActiveUsersState();

      // Get job state to check chunk metadata
      const jobState = await jobStateService.getJobState(uploadId);
      if (!jobState) {
        logger.error('Job state not found when adding to queue', { uploadId });
        return false;
      }

      // For chunk jobs, only allow if they belong to an existing upload
      if (jobState.isChunk && jobState.parentUploadId) {
        const baseJobId = jobState.parentUploadId;
        const hasParentJob = activeState.activeUsers[userId]?.uploadId === baseJobId ||
                           queueState.queue.some(entry => entry.uploadId === baseJobId);
        
        if (!hasParentJob) {
          logger.debug('Chunk job rejected - no parent job found', {
            userId,
            jobId: uploadId,
            parentUploadId: baseJobId
          });
          return false;
        }

        // Check if this chunk belongs to a completed upload
        const uploadStatus = await jobStateService.getChunkedUploadStatus(baseJobId);
        if (uploadStatus.isComplete) {
          logger.debug('Chunk rejected - parent upload already complete', {
            jobId: uploadId,
            parentUploadId: baseJobId
          });
          return false;
        }
      } else {
        // For new uploads, block if user has ANY active upload or queued job
        if (activeState.activeUsers[userId]) {
          logger.debug('User already has active upload', {
            userId,
            activeUpload: activeState.activeUsers[userId].uploadId,
            activeState
          });
          return false;
        }
  
        // Only check for existing uploads if this is not a chunk
        if (!jobState.isChunk) {
          if (queueState.queue.some(entry => entry.userId === userId)) {
            logger.debug('User already has upload in queue', {
              userId,
              queueState
            });
            return false;
          }
        }
      }

      // Add to queue
      const entry = {
        uploadId,
        userId,
        queuedAt: Date.now()
      };
      queueState.queue.push(entry);

      logger.debug('Adding job to queue:', {
        jobId: uploadId,
        isChunk: this.isChunkJob(uploadId),
        userId,
        queueLength: queueState.queue.length,
        queueState
      });

      // Update queue state
      await uploadObject(QUEUE_FILE, JSON.stringify(queueState));
      logger.debug('Queue state updated', {
        queueFile: QUEUE_FILE,
        queueLength: queueState.queue.length,
        jobs: queueState.queue.map(e => e.uploadId)
      });
      
      // Update queue length in active users state
      activeState.queueLength = queueState.queue.length;
      await uploadObject(ACTIVE_USERS_FILE, JSON.stringify(activeState));

      logger.debug('Successfully added job to queue');
      return true;
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

      const nextEntry = queueState.queue[0]; // Look at next job without removing it yet
      logger.debug('Found next job in queue:', {
        jobId: nextEntry.uploadId,
        userId: nextEntry.userId,
        queuedAt: new Date(nextEntry.queuedAt).toISOString()
      });

      // Only process jobs with sync: prefix - these are ready to be synced
      if (!nextEntry.uploadId.startsWith('sync:')) {
        logger.debug('Skipping non-sync job', { jobId: nextEntry.uploadId });
        return null;
      }

      // Verify job exists in job state service before moving to active
      const jobState = await jobStateService.getJobState(nextEntry.uploadId);
      if (!jobState) {
        logger.error('Job not found in job state service', {
          jobId: nextEntry.uploadId
        });
        // Remove invalid job from queue
        queueState.queue.shift();
        await uploadObject(QUEUE_FILE, JSON.stringify(queueState));
        return null;
      }

      logger.debug('Found valid job in queue:', {
        jobId: nextEntry.uploadId,
        state: jobState.state
      });

      // Return the next job without removing it from queue
      return queueState.queue[0] || null;
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
        const hasMoreChunks = queueState.queue.some(entry =>
          this.getBaseJobId(entry.uploadId) === baseUploadId
        );

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
        activeState.activeUsers[userId] = {
          uploadId: uploadId.split('_')[0], // Get base upload ID without chunk number
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