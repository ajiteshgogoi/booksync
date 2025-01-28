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

    // Get current job state for cleanup
    const currentState = await jobStateService.getJobState(jobId);
    if (!currentState || !currentState.userId) {
      throw new Error('Job state or userId not found during cleanup');
    }

    // For chunk jobs, we need special handling
    if (currentState.isChunk && currentState.parentUploadId) {
      // Check parent upload status
      const uploadStatus = await jobStateService.getChunkedUploadStatus(currentState.parentUploadId);
      
      // Only clean up if all chunks are complete
      if (uploadStatus.isComplete) {
        logger.info('All chunks complete, cleaning up resources', {
          jobId,
          parentUploadId: currentState.parentUploadId
        });
        
        // Clean up chunk resources
        await Promise.all([
          deleteObject(`${jobId}.txt`),
          tempStorageService.cleanupJob(jobId),
          deleteObject(`temp/${jobId}_state.json`),
          // Don't delete job state yet - worker service needs it
          queueService.removeFromActive(currentState.userId)
        ]).catch(error => {
          logger.error('Error cleaning up after successful chunk', { jobId, error });
        });
      } else {
        logger.info('Chunk complete but waiting for other chunks', {
          jobId,
          parentUploadId: currentState.parentUploadId,
          status: uploadStatus
        });
      }
    } else {
      // Non-chunk job cleanup
      await Promise.all([
        deleteObject(`${jobId}.txt`),
        tempStorageService.cleanupJob(jobId),
        deleteObject(`temp/${jobId}_state.json`),
        // Don't delete job state yet - worker service needs it
        queueService.removeFromActive(currentState.userId)
      ]).catch(error => {
        logger.error('Error cleaning up after successful job', { jobId, error });
      });
    }

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

    // Get current job state for cleanup in error case
    const currentState = await jobStateService.getJobState(jobId);
    if (!currentState || !currentState.userId) {
      throw new Error('Job state or userId not found during error cleanup');
    }

    // For chunk jobs, handle differently
    if (currentState.isChunk && currentState.parentUploadId) {
      const uploadStatus = await jobStateService.getChunkedUploadStatus(currentState.parentUploadId);
      
      // Only clean up resources if all chunks are complete (success or failure)
      if (uploadStatus.isComplete) {
        logger.info('All chunks processed (with failures), cleaning up resources', {
          jobId,
          parentUploadId: currentState.parentUploadId,
          status: uploadStatus
        });
        
        await Promise.all([
          deleteObject(`${jobId}.txt`),
          tempStorageService.cleanupJob(jobId),
          deleteObject(`temp/${jobId}_state.json`),
          // Don't delete job state yet - worker service needs it
          queueService.removeFromActive(currentState.userId)
        ]).catch(error => {
          logger.error('Error cleaning up after failed chunk', { jobId, error });
        });
      } else {
        logger.info('Chunk failed but others still processing', {
          jobId,
          parentUploadId: currentState.parentUploadId,
          status: uploadStatus
        });
      }
    } else {
      // Non-chunk job cleanup
      await Promise.all([
        deleteObject(`${jobId}.txt`),
        tempStorageService.cleanupJob(jobId),
        deleteObject(`temp/${jobId}_state.json`),
        // Don't delete job state yet - worker service needs it
        queueService.removeFromActive(currentState.userId)
      ]).catch(error => {
        logger.error('Error cleaning up after failed job', { jobId, error });
      });
    }

    // Re-throw the original error
    throw error;
  }
}
