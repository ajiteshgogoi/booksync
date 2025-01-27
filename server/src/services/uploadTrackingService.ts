import { JobStatus } from '../types/job.js';
import { logger } from '../utils/logger.js';
import { uploadObject, downloadObject } from './r2Service.js';

const UPLOAD_STATUS_PREFIX = 'upload-status/';
const UPLOAD_JOBS_PREFIX = 'upload-jobs/';
const JOB_TTL = 3600; // 1 hour

interface UploadTracking {
  userId: string;          // Notion user ID
  uploadId: string;
  jobs: Array<{
    jobId: string;
    state: string;
    highlightCount: number;
  }>;
  totalHighlights: number;
  createdAt: number;
  updatedAt: number;
}

export async function startUpload(userId: string, uploadId: string, totalHighlights: number): Promise<void> {
  try {
    // Check if user has an active upload
    const activeUpload = await getUserActiveUpload(userId);
    if (activeUpload) {
      throw new Error('User already has an active file upload');
    }

    // Create new upload tracking
    const tracking: UploadTracking = {
      userId,
      uploadId,
      jobs: [],
      totalHighlights,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // Store tracking data
    await Promise.all([
      uploadObject(`${UPLOAD_STATUS_PREFIX}${userId}.json`, JSON.stringify(tracking)),
      uploadObject(`${UPLOAD_JOBS_PREFIX}${uploadId}.json`, JSON.stringify(tracking))
    ]);

    logger.debug(`Started new upload ${uploadId} for user ${userId} with ${totalHighlights} highlights`);
  } catch (error) {
    logger.error(`Error starting upload for user ${userId}:`, error);
    throw error;
  }
}

export async function addJobToUpload(uploadId: string, jobId: string, highlightCount: number): Promise<void> {
  try {
    // Get current tracking data
    const tracking = await getUploadTracking(uploadId);
    if (!tracking) {
      throw new Error(`Upload ${uploadId} not found`);
    }

    // Add job and update timestamp
    tracking.jobs.push({
      jobId,
      state: 'created',
      highlightCount
    });
    tracking.updatedAt = Date.now();

    // Update tracking data
    await uploadObject(
      `${UPLOAD_JOBS_PREFIX}${uploadId}.json`,
      JSON.stringify(tracking)
    );

    logger.debug(`Added job ${jobId} to upload ${uploadId} with ${highlightCount} highlights`);
  } catch (error) {
    logger.error(`Error adding job ${jobId} to upload ${uploadId}:`, error);
    throw error;
  }
}

export async function completeJob(uploadId: string, jobId: string): Promise<boolean> {
  try {
    // Get current tracking data
    const tracking = await getUploadTracking(uploadId);
    if (!tracking) {
      logger.warn(`Upload ${uploadId} not found`);
      return false;
    }

    // Remove completed job from tracking
    tracking.jobs = tracking.jobs.filter(job => job.jobId !== jobId);
    tracking.updatedAt = Date.now();

    if (tracking.jobs.length === 0) {
      // If no more jobs, clean up tracking
      await Promise.all([
        uploadObject(`${UPLOAD_STATUS_PREFIX}${tracking.userId}.json`, ''),
        uploadObject(`${UPLOAD_JOBS_PREFIX}${uploadId}.json`, '')
      ]);
      
      logger.info(`Completing upload ${uploadId} for user ${tracking.userId}`);
      return true;
    } else {
      // Update tracking with remaining jobs
      await uploadObject(
        `${UPLOAD_JOBS_PREFIX}${uploadId}.json`,
        JSON.stringify(tracking)
      );
    }

    return false;
  } catch (error) {
    logger.error(`Error completing job ${jobId} in upload ${uploadId}:`, error);
    throw error;
  }
}

export async function getUploadStatus(userId: string): Promise<string | null> {
  try {
    const tracking = await getUserActiveUpload(userId);
    return tracking?.uploadId || null;
  } catch (error) {
    logger.error(`Error getting upload status for user ${userId}:`, error);
    throw error;
  }
}

// Helper functions
async function getUploadTracking(uploadId: string): Promise<UploadTracking | null> {
  try {
    const data = await downloadObject(`${UPLOAD_JOBS_PREFIX}${uploadId}.json`);
    const tracking = JSON.parse(data.toString()) as UploadTracking;

    // Check if upload has expired
    if (Date.now() - tracking.updatedAt > JOB_TTL * 1000) {
      await cleanupExpiredUpload(tracking);
      return null;
    }

    return tracking;
  } catch (error) {
    return null;
  }
}

async function getUserActiveUpload(userId: string): Promise<UploadTracking | null> {
  try {
    const data = await downloadObject(`${UPLOAD_STATUS_PREFIX}${userId}.json`);
    const tracking = JSON.parse(data.toString()) as UploadTracking;

    // Check if upload has expired
    if (Date.now() - tracking.updatedAt > JOB_TTL * 1000) {
      await cleanupExpiredUpload(tracking);
      return null;
    }

    return tracking;
  } catch (error) {
    return null;
  }
}

async function cleanupExpiredUpload(tracking: UploadTracking): Promise<void> {
  try {
    await Promise.all([
      uploadObject(`${UPLOAD_STATUS_PREFIX}${tracking.userId}.json`, ''),
      uploadObject(`${UPLOAD_JOBS_PREFIX}${tracking.uploadId}.json`, '')
    ]);
    logger.info(`Cleaned up expired upload ${tracking.uploadId} for user ${tracking.userId}`);
  } catch (error) {
    logger.error('Error cleaning up expired upload:', error);
  }
}
