import { logger } from '../utils/logger.js';
import { parseClippings } from '../utils/parseClippings.js';
import { queueSyncJob, processSyncJob } from './syncService.js';
import { downloadObject } from './r2Service.js';
import { jobStateService } from './jobStateService.js';
import { queueService } from './queueService.js';
import { tempStorageService } from './tempStorageService.js';

export async function processFileContent(
  userId: string,
  fileContent: string,
  databaseId: string
): Promise<string> {
  try {
    logger.info('Processing file content', {
      userId,
      databaseId,
      contentLength: fileContent.length
    });

    // Create job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create job metadata
    await jobStateService.createJob({
      jobId,
      fileName: 'uploaded-content.txt',
      userId,
      databaseId
    });

    // Store content in R2 temp storage
    await tempStorageService.storeFileContent(jobId, fileContent);

    // Parse the content and store highlights
    const highlights = await parseClippings(fileContent);
    await tempStorageService.storeHighlights(jobId, highlights);

    // Queue the job for processing
    const jobIdFromQueue = await queueSyncJob(databaseId, fileContent, userId);

    // Add to processing queue
    await queueService.addToQueue(jobIdFromQueue, userId);

    logger.info('Sync job queued successfully', { jobId: jobIdFromQueue });
    return jobIdFromQueue;
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
  try {
    // Get job metadata
    const jobState = await jobStateService.getJobState(jobId);
    if (!jobState) {
      throw new Error('Job not found');
    }

    // Update job state to queued
    await jobStateService.updateJobState(jobId, {
      state: 'queued',
      message: 'Starting file processing'
    });

    // Ensure we have highlights in temporary storage
    if (!await tempStorageService.exists(jobId, 'highlights')) {
      // If highlights don't exist, we need to reprocess the file content
      if (!await tempStorageService.exists(jobId, 'content')) {
        // Get content from uploads
        const fileContent = await downloadObject(`uploads/${jobId}.txt`);
        await tempStorageService.storeFileContent(jobId, fileContent.toString('utf-8'));
      }

      // Re-parse the content
      const fileContent = await tempStorageService.getFileContent(jobId);
      const highlights = await parseClippings(fileContent);
      await tempStorageService.storeHighlights(jobId, highlights);

      // Update job state to parsed
      await jobStateService.updateJobState(jobId, {
        state: 'parsed',
        message: 'File parsed successfully',
        total: highlights.length
      });
    }

    // Process the job using existing syncService
    await processSyncJob(jobId, async (progress: number, message: string) => {
      await jobStateService.updateJobState(jobId, {
        state: 'processing',
        progress,
        message
      });
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing file', { jobId, error: errorMessage });

    await jobStateService.updateJobState(jobId, {
      state: 'failed',
      message: `Processing failed: ${errorMessage}`,
      errorDetails: errorMessage
    });

    throw error;
  }

  logger.info('File processing completed successfully', { jobId });
}
