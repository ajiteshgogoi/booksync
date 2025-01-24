import { logger } from '../utils/logger.js';
import { getRedis, setJobStatus, RedisPool } from './redisService.js';
import { queueSyncJob, processSyncJob } from './syncService.js';

export async function processFileContent(
  userId: string,
  fileContent: string,
  databaseId: string
): Promise<void> {
  try {
    logger.info('Processing file content', {
      userId,
      databaseId,
      contentLength: fileContent.length
    });

    // Queue sync job to process highlights
    const jobId = await queueSyncJob(databaseId, fileContent);
    logger.info('Sync job queued successfully', { jobId });
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
    // Update status to processing
    await setJobStatus(jobId, {
      state: 'processing',
      message: 'Processing highlights'
    });

    // Process the highlights directly from Redis
    await processSyncJob(jobId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing file', { jobId, error: errorMessage });
    throw error;
  }
}
