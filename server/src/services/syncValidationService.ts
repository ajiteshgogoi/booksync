import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import { logger } from '../utils/logger.js';
import { KVStore, createKVStore } from '../../../shared/src/services/kvStore.js';
import type { Job } from '../../../workers/src/types/job.js';

const ACTIVE_UPLOADS_KEY = 'active_uploads_count';

export class ValidationError extends Error {
    public readonly errorType = 'ValidationError';

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class SyncValidationService {
    private kvStore: KVStore;
    private jobStoreUrl: string;

    constructor(kvStore: KVStore, jobStoreUrl: string) {
        this.kvStore = kvStore;
        this.jobStoreUrl = jobStoreUrl;
    }

    private async getActiveUploadCount(): Promise<number> {
        const count = await this.kvStore.get(ACTIVE_UPLOADS_KEY);
        return count ? parseInt(count, 10) : 0;
    }

    private async hasUserPendingJob(userId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.jobStoreUrl}/list?userId=${userId}`);
            if (!response.ok) {
                throw new Error(`Failed to check user jobs: ${response.statusText}`);
            }
            
            const jobs: Job[] = await response.json();
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
        // Check active uploads
        const activeUploads = await this.getActiveUploadCount();
        logger.info('[SyncValidation] Checking active uploads', { activeUploads, userId });
        
        // Check if user already has an active upload
        const userHasActiveUpload = await this.hasUserPendingJob(userId);
        if (userHasActiveUpload) {
            logger.warn('[SyncValidation] User already has active upload', {
                userId,
                status: 'Upload blocked'
            });
            throw new ValidationError('You already have an active upload processing. Try again later.');
        }
        
        // Check global upload limit
        if (activeUploads >= UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
            logger.warn('[SyncValidation] Upload limit reached', {
                activeUploads,
                maxUploads: UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS,
                status: 'Upload blocked'
            });
            throw new ValidationError('Too many users are using the service right now. Please try again later.');
        }
    }
}

// Create default instance
const kvStore = createKVStore();
const jobStoreUrl = process.env.JOB_STORE_URL || 'http://localhost:8787/jobs';
export const syncValidationService = new SyncValidationService(kvStore, jobStoreUrl);
