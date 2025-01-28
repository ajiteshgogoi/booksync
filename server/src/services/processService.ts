import { logger } from '../utils/logger.js';
import { processSyncJob } from './syncService.js';
import { deleteObject } from './r2Service.js';
import { jobStateService, JobMetadata } from './jobStateService.js';
import { CleanupService } from './cleanupService.js';
import { queueService } from './queueService.js';
import { tempStorageService } from './tempStorageService.js';

export async function processFile(jobId: string): Promise<void> {
  // Define processing timeout
  const PROCESSING_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const startTime = Date.now();

  // Implement timeout check function
  const checkTimeout = () => {
    if (Date.now() - startTime > PROCESSING_TIMEOUT) {
      throw new Error('Processing timeout exceeded');
    }
  };

  try {
    // Get job metadata
    const jobState = await jobStateService.getJobState(jobId);
    if (!jobState) {
      throw new Error('Job not found');
    }

    // Verify job is in 'parsed' state before proceeding
    if (jobState.state !== 'parsed') {
      logger.info(`Job ${jobId} is not in parsed state: ${jobState.state}`);
      return;
    }

    // Check if highlights exist in temp storage
    const highlightsExist = await tempStorageService.exists(jobId, 'highlights');
    if (!highlightsExist) {
      logger.warn('Upload not found', { jobId });
      throw new Error('Upload not found - highlights missing from temp storage');
    }

    // Update state to processing before starting work
    await jobStateService.updateJobState(jobId, {
      state: 'processing',
      message: 'Starting file processing',
      lastCheckpoint: Date.now()
    });

    checkTimeout();

    // Process the job using existing syncService with timeout checks
    await processSyncJob(jobId, async (progress: number, message: string) => {
      checkTimeout();
      await jobStateService.updateJobState(jobId, {
        state: 'processing',
        progress,
        message,
        lastCheckpoint: Date.now()
      });
    });

    // Final state update
    await jobStateService.updateJobState(jobId, {
      state: 'completed',
      message: 'Processing completed successfully',
      completedAt: Date.now(),
      progress: 100
    });

    // Clean up all associated files and state
    // Get job metadata to get userId for queue cleanup
    const currentState = await jobStateService.getJobState(jobId);
    
    // Extract uploadId from jobId format (sync:userId:timestamp or sync:userId:timestamp_chunkNum)
    const uploadId = jobId.replace(/^sync:/, 'upload:').split('_')[0];
    
    // Check if all jobs for this upload are complete
    const uploadJobs = await jobStateService.getJobsByUploadId(uploadId);
    const allJobsComplete = uploadJobs.every(job =>
      job.state === 'completed' || job.state === 'failed'
    );

    // Clean up current job resources
    await Promise.all([
      deleteObject(`${jobId}.txt`),
      tempStorageService.cleanupJob(jobId),
      deleteObject(`temp/${jobId}_state.json`),
      jobStateService.deleteJob(jobId),

      // Only remove from active users if this was the last job for this upload
      (allJobsComplete && currentState?.userId)
        ? queueService.removeFromActive(currentState.userId)
        : Promise.resolve()
    ]).catch(error => {
      logger.error('Error cleaning up after successful job', { jobId, error });
    });

    logger.info('File processing and cleanup completed successfully', { jobId });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing file', { jobId, error: errorMessage });

    await jobStateService.updateJobState(jobId, {
      state: 'failed',
      message: `Processing failed: ${errorMessage}`,
      errorDetails: errorMessage,
      completedAt: Date.now()
    });

    // Get job metadata for cleanup even in failure case
    const currentState = await jobStateService.getJobState(jobId);
    if (!currentState?.userId) {
      throw new Error('Missing userId in job state during cleanup');
    }

    // Extract uploadId and check if all jobs are complete
    const uploadId = jobId.replace(/^sync:/, 'upload:').split('_')[0];
    const uploadJobs = await jobStateService.getJobsByUploadId(uploadId);
    const allJobsComplete = uploadJobs.every(job =>
      job.state === 'completed' || job.state === 'failed'
    );

    // Clean up job-specific resources
    await Promise.all([
      deleteObject(`${jobId}.txt`),
      tempStorageService.cleanupJob(jobId),
      deleteObject(`temp/${jobId}_state.json`),
      jobStateService.deleteJob(jobId),
      
      // Only remove from active users if this was the last job for this upload
      allJobsComplete ? queueService.removeFromActive(currentState.userId) : Promise.resolve()
    ]).catch(error => {
      logger.error('Error cleaning up after failed job', { jobId, error });
    });

    throw error;
  }
}
