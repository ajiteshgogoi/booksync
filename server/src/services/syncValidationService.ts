import { getActiveUploadCount, hasUserPendingJob, getRedis, redisPool } from './redisService.js';
import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import { logger } from '../utils/logger.js';

const VALIDATION_KEY_PREFIX = 'validation:';
const VALIDATION_TTL = 300; // 5 minutes
const VALIDATION_CHECK_INTERVAL = 500; // 500ms
const VALIDATION_MAX_WAIT = 30000; // 30 seconds

export class ValidationError extends Error {
    public readonly errorType = 'ValidationError';

    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

interface ValidationState {
    status: 'pending' | 'completed' | 'failed';
    error?: string;
}

async function setValidationState(userId: string, state: ValidationState): Promise<void> {
    const redis = await getRedis();
    try {
        await redis.set(
            `${VALIDATION_KEY_PREFIX}${userId}`,
            JSON.stringify(state),
            'EX',
            VALIDATION_TTL
        );
    } finally {
        redisPool.release(redis);
    }
}

async function getValidationState(userId: string): Promise<ValidationState | null> {
    const redis = await getRedis();
    try {
        const state = await redis.get(`${VALIDATION_KEY_PREFIX}${userId}`);
        return state ? JSON.parse(state) : null;
    } finally {
        redisPool.release(redis);
    }
}

export async function validateSync(userId: string): Promise<void> {
    // Set initial validation state
    await setValidationState(userId, { status: 'pending' });

    try {
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
            await setValidationState(userId, {
                status: 'failed',
                error: 'You already have an active upload processing. Try again later.'
            });
            throw new ValidationError('You already have an active upload processing. Try again later.');
        }
        
        // Check global upload limit
        if (activeUploads >= UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
            logger.warn('[UploadValidation] Upload limit reached', {
                activeUploads,
                maxUploads: UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS,
                status: 'Upload blocked'
            });
            await setValidationState(userId, {
                status: 'failed',
                error: 'Too many users are using the service right now. Please try again later.'
            });
            throw new ValidationError('Too many users are using the service right now. Please try again later.');
        }

        // Validation successful
        await setValidationState(userId, { status: 'completed' });
    } catch (error) {
        // If error wasn't already handled, set failed state
        const state = await getValidationState(userId);
        if (state?.status === 'pending') {
            await setValidationState(userId, {
                status: 'failed',
                error: error instanceof Error ? error.message : 'Validation failed'
            });
        }
        throw error;
    }
}

export async function waitForValidation(userId: string): Promise<void> {
    const startTime = Date.now();
    
    while (true) {
        const state = await getValidationState(userId);
        
        if (!state) {
            throw new ValidationError('No validation in progress');
        }

        if (state.status === 'completed') {
            return;
        }

        if (state.status === 'failed') {
            throw new ValidationError(state.error || 'Validation failed');
        }

        if (Date.now() - startTime > VALIDATION_MAX_WAIT) {
            throw new ValidationError('Validation timed out');
        }

        await new Promise(resolve => setTimeout(resolve, VALIDATION_CHECK_INTERVAL));
    }
}