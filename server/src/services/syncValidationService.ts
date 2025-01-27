import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import { logger } from '../utils/logger.js';
import { queueService } from './queueService.js';
import { getUploadStatus } from './uploadTrackingService.js';

export class ValidationError extends Error {
    public readonly errorType = 'ValidationError';

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export async function validateSync(userId: string): Promise<void> {
    // Check if user already has an active upload
    const userActiveUpload = await getUploadStatus(userId);
    if (userActiveUpload) {
        logger.warn('[SyncValidation] User already has active upload', {
            userId,
            uploadId: userActiveUpload,
            status: 'Upload blocked'
        });
        throw new ValidationError('You already have an active upload processing. Try again later.');
    }

    // Check active user count from queue service
    const activeCount = await queueService.getActiveUserCount();
    logger.info('[SyncValidation] Checking active uploads', { activeCount, userId });
    
    // Check global upload limit
    if (activeCount >= UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
        logger.warn('[SyncValidation] Upload limit reached', {
            activeCount,
            maxUploads: UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS,
            status: 'Upload blocked'
        });
        throw new ValidationError('Too many users are using the service right now. Please try again later.');
    }
}