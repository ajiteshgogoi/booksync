import { logger } from '../utils/logger.js';
import { parseClippings } from '../utils/parseClippings.js';
import { queueSyncJob, processSyncJob } from './syncService.js';
import { downloadObject, deleteObject } from './r2Service.js';
import { jobStateService } from './jobStateService.js';
import { CleanupService } from './cleanupService.js';
import { queueService } from './queueService.js';
import { tempStorageService } from './tempStorageService.js';

export async function processFileContent(
  userId: string,
  fileContent: string,
  databaseId: string,
  jobId: string
): Promise<string> {
  try {
    logger.info('Processing file content', {
      userId,
      databaseId,
      jobId,
      contentLength: fileContent.length
    });

    // Set state to queued
    await jobStateService.updateJobState(jobId, {
      state: 'queued',
      message: 'Starting file processing'
    });

    // File content is already streamed from root by parseHighlights.js

    // Parse the content
    const highlights = await parseClippings(fileContent);
    
    logger.debug('Storing highlights in temp storage', {
      jobId,
      highlightCount: highlights.length,
      path: `highlights/${jobId}.json`
    });

    // Store highlights in temp storage
    await tempStorageService.storeHighlights(jobId, highlights);

    // Verify highlights were stored
    const stored = await tempStorageService.exists(jobId, 'highlights');
    if (!stored) {
      throw new Error('Failed to store highlights in temp storage');
    }

    // After successfully storing highlights, update state and add to queue
    const updatedState = await jobStateService.updateJobState(jobId, {
      state: 'parsed',
      message: 'Highlights parsed and stored successfully',
      total: highlights.length,
      progress: 0,
      lastCheckpoint: Date.now()
    });

    logger.debug('Highlights stored and state updated', {
      jobId,
      stored,
      state: 'parsed',
      total: highlights.length
    });

    // Add to queue after successful parsing and storing
    if (updatedState?.userId) {
      const jobState = updatedState;

      if (jobState) {
        // Only add to queue after successful parsing and state update
        await queueService.addToQueue(jobId, updatedState.userId);
        logger.info('Job added to processing queue', { jobId });
      } else {
        logger.error('Failed to update job state to parsed', { jobId });
      }
    } else {
      logger.error('Could not add job to queue - missing userId', { jobId });
    }

    logger.info('File parsed successfully', { jobId });
    return jobId;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing file content', {
      userId,
      databaseId,
      error: errorMessage
    });
    throw error;
  }
}

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

    // Get the current state and validate transition
    switch (jobState.state) {
      case 'pending':
        await jobStateService.updateJobState(jobId, {
          state: 'queued',
          message: 'Starting file processing'
        });
        break;
      case 'completed':
      case 'failed':
        logger.info(`Job ${jobId} is already in terminal state: ${jobState.state}`);
        return;
      case 'processing':
        if (jobState.lastCheckpoint && Date.now() - jobState.lastCheckpoint > PROCESSING_TIMEOUT) {
          throw new Error('Processing timeout exceeded');
        }
        break;
      default:
        break;
    }

    // Check if highlights exist in temp storage
    const highlightsExist = await tempStorageService.exists(jobId, 'highlights');
    if (!highlightsExist) {
      logger.warn('Upload not found', { jobId });
      throw new Error('Upload not found - highlights missing from temp storage');
    }

    // Don't proceed with processing if job isn't in 'parsed' state
    const updatedState = await jobStateService.getJobState(jobId);
    if (updatedState?.state !== 'parsed') {
      logger.info(`Job ${jobId} not ready for processing, current state: ${updatedState?.state}`);
      return;
    }

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
    
    await Promise.all([
      // Clean up original upload
      deleteObject(`${jobId}.txt`),
      // Clean up temp files, highlights, and processing state
      tempStorageService.cleanupJob(jobId),
      deleteObject(`temp/${jobId}_state.json`),
      // Delete job state
      jobStateService.deleteJob(jobId),
      // Remove from queue if present
      currentState?.userId ? queueService.removeFromActive(currentState.userId) : Promise.resolve()
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
    const userId = currentState?.userId;

    if (userId) {
      // Clean up on failure too
      await Promise.all([
        deleteObject(`${jobId}.txt`),
        tempStorageService.cleanupJob(jobId),
        deleteObject(`temp/${jobId}_state.json`),
        jobStateService.deleteJob(jobId),
        // Remove from queue if present
        queueService.removeFromActive(userId),
        // Update active users state - this checks other jobs/uploads and removes from active if none remain
        CleanupService.updateUserActiveStatus(userId, {
          hasActiveUploads: false,
          hasActiveJobs: false
        })
      ]).catch(error => {
        logger.error('Error cleaning up after failed job', { jobId, error });
      });
    }

    throw error;
  }
}
