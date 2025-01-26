import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import { logger } from '../utils/logger.js';
import { KVStore, createKVStore } from '../../../shared/src/services/kvStore.js';
import type { Job } from '../../../workers/src/types/job.js';

export const ACTIVE_UPLOADS_KEY = 'active_uploads_count';
const UPLOAD_COUNT_TTL = 60 * 60; // 1 hour TTL for upload counts

export class ValidationError extends Error {
    public readonly errorType = 'ValidationError';

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export interface JobState {
    getUserPendingJobs(userId: string): Promise<Job[]>;
}

export class SyncValidationService {
    constructor(
        private kvStore: KVStore,
        private jobState: JobState
    ) {}

    private async getActiveUploadCount(): Promise<number> {
        try {
            const count = await this.kvStore.get(ACTIVE_UPLOADS_KEY);
            return count ? parseInt(count, 10) : 0;
        } catch (error) {
            logger.error('[SyncValidation] Error getting active upload count', { error });
            return 0;
        }
    }

    private async hasUserPendingJob(userId: string): Promise<boolean> {
        try {
            const jobs = await this.jobState.getUserPendingJobs(userId);
            return jobs.some(job => 
                job.userId === userId && 
                ['pending', 'processing'].includes(job.status)
            );
        } catch (error) {
            logger.error('[SyncValidation] Error checking user jobs', { error });
            throw new Error('Failed to check job status');
        }
    }

    async validateSync(userId: string): Promise<void> {
        // Check if user already has an active upload
        const userHasActiveUpload = await this.hasUserPendingJob(userId);
        if (userHasActiveUpload) {
            logger.warn('[SyncValidation] User already has active upload', {
                userId,
                status: 'Upload blocked'
            });
            throw new ValidationError('You already have an active upload processing. Try again later.');
        }
        
        // Check active uploads using atomic increment
        let activeUploads: number;
        try {
            activeUploads = await this.kvStore.increment(ACTIVE_UPLOADS_KEY);
            
            // Set TTL to prevent stale counters
            await this.kvStore.set(ACTIVE_UPLOADS_KEY, activeUploads.toString(), {
                expirationTtl: UPLOAD_COUNT_TTL
            });
        } catch (error) {
            logger.error('[SyncValidation] Error managing upload count', { error });
            activeUploads = await this.getActiveUploadCount();
        }

        logger.info('[SyncValidation] Checking active uploads', { activeUploads, userId });
        
        // Check global upload limit
        if (activeUploads > UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
            // Decrement since we're rejecting this upload
            await this.kvStore.decrement(ACTIVE_UPLOADS_KEY).catch(error => {
                logger.error('[SyncValidation] Error decrementing upload count', { error });
            });

            logger.warn('[SyncValidation] Upload limit reached', {
                activeUploads,
                maxUploads: UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS,
                status: 'Upload blocked'
            });
            throw new ValidationError('Too many users are using the service right now. Please try again later.');
        }
    }

    async markUploadComplete(): Promise<void> {
        try {
            await this.kvStore.decrement(ACTIVE_UPLOADS_KEY);
        } catch (error) {
            logger.error('[SyncValidation] Error decrementing upload count', { error });
        }
    }
}

// Do not create default instance - this should be initialized with proper dependencies
// in the Workers environment or server environment as needed
export const createSyncValidationService = (kvStore: KVStore, jobState: JobState): SyncValidationService => {
    return new SyncValidationService(kvStore, jobState);
};
