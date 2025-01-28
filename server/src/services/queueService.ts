import { logger } from '../utils/logger.js';
import { uploadObject, downloadObject, deleteObject } from './r2Service.js';
import { jobStateService } from './jobStateService.js';

const LOCK_TIMEOUT = 30000; // 30 seconds
const MAX_ACTIVE_USERS = 5; // Maximum concurrent active users
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

      // Check if user already has an active upload
      if (activeState.activeUsers[userId]) {
        return false;
      }

      // Check if user is already in queue
      if (queueState.queue.some(entry => entry.userId === userId)) {
        return false;
      }

      // Add to queue
      const entry = {
        uploadId,  // This is actually the sync:userId:timestamp job ID
        userId,
        queuedAt: Date.now()
      };
      queueState.queue.push(entry);

      logger.debug('Adding job to queue:', {
        jobId: uploadId,
        userId,
        queueLength: queueState.queue.length
      });

      // Update queue state
      await uploadObject(QUEUE_FILE, JSON.stringify(queueState));
      
      // Update queue length in active users state
      activeState.queueLength = queueState.queue.length;
      await uploadObject(ACTIVE_USERS_FILE, JSON.stringify(activeState));

      logger.debug('Successfully added job to queue');
      return true;
    } finally {
      await this.releaseLock('queue');
    }
  }

  async moveToActive(): Promise<QueueEntry | null> {
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

      const nextEntry = queueState.queue.shift();
      if (!nextEntry) {
        logger.debug('No jobs in queue');
        return null;
      }

      logger.debug('Found next job in queue:', {
        jobId: nextEntry.uploadId,
        userId: nextEntry.userId,
        queuedAt: new Date(nextEntry.queuedAt).toISOString()
      });

      // Only process jobs with sync: prefix - these are ready to be synced
      if (!nextEntry.uploadId.startsWith('sync:')) {
        logger.debug('Skipping non-sync job', { jobId: nextEntry.uploadId });
        // Put entry back in queue
        queueState.queue.unshift(nextEntry);
        await uploadObject(QUEUE_FILE, JSON.stringify(queueState));
        return null;
      }

      logger.debug('Moving job to active state:', { jobId: nextEntry.uploadId });

      // Update both states since we have a valid job to process
      activeState.activeUsers[nextEntry.userId] = {
        uploadId: nextEntry.uploadId,
        startedAt: Date.now()
      };
      activeState.queueLength = queueState.queue.length;
      
      await uploadObject(QUEUE_FILE, JSON.stringify(queueState));
      await uploadObject(ACTIVE_USERS_FILE, JSON.stringify(activeState));

      return nextEntry;
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
      delete activeState.activeUsers[userId];
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

  async getQueueLength(): Promise<number> {
    const activeState = await this.getActiveUsersState();
    return activeState.queueLength;
  }

  async getActiveUserCount(): Promise<number> {
    const activeState = await this.getActiveUsersState();
    return Object.keys(activeState.activeUsers).length;
  }
}

export const queueService = QueueService.getInstance();