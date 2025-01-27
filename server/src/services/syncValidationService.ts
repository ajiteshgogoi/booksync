import { getActiveUploadCount, hasUserPendingJob } from './redisService.js';
import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import { logger } from '../utils/logger.js';

export class ValidationError extends Error {
    public readonly errorType = 'ValidationError';

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export async function validateSync(userId: string): Promise<void> {
    // Check active uploads
    const activeUploads = await getActiveUploadCount();
    logger.info('[SyncValidation] Checking active uploads', { activeUploads, userId });
    
    // Check if user already has an active upload
    const userHasActiveUpload = await hasUserPendingJob(userId);
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