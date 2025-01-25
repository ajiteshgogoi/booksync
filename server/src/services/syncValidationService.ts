import { getActiveUploadCount, hasUserPendingJob } from './redisService.js';
import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import { logger } from '../utils/logger.js';

export async function validateSync(userId: string): Promise<void> {
    // Check active uploads
    const activeUploads = await getActiveUploadCount();
    logger.info('[UploadValidation] Checking active uploads', { activeUploads, userId });
    
    // Check if user already has an active upload
    const userHasActiveUpload = await hasUserPendingJob(userId);
    if (userHasActiveUpload) {
        logger.warn('[UploadValidation] User already has active upload', {
            userId,
            status: 'Upload blocked'
        });
        throw new Error('You already have an active upload processing. Try again later.');
    }
    
    // Check global upload limit
    if (activeUploads >= UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
        logger.warn('[UploadValidation] Upload limit reached', {
            activeUploads,
            maxUploads: UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS,
            status: 'Upload blocked'
        });
        throw new Error('Too many users are using the service right now. Please try again later.');
    }
}