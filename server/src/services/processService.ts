import { logger } from '../utils/logger.js';
import { getRedis, setJobStatus } from './redisService.js';
import { downloadObject, uploadObject, getObjectInfo } from './r2Service.js';

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

    // Process the file content
    // Here you would implement your specific file processing logic
    // For example, parsing highlights, extracting text, etc.
    
    logger.info('File content processed successfully');
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
  const redis = await getRedis();
  
  try {
    // Get file info from R2
    const fileInfo = await getObjectInfo(jobId);
    if (!fileInfo) {
      throw new Error('File not found in R2 storage');
    }

    // Update status with total size
    await setJobStatus(jobId, {
      state: 'processing',
      message: 'Downloading file',
      total: fileInfo.size
    });

    // Download file from R2
    const fileData = await downloadObject(jobId);
    if (!fileData) {
      throw new Error('Failed to download file from R2');
    }

    // Update status
    await setJobStatus(jobId, {
      state: 'processing',
      message: 'Processing file contents',
      progress: fileInfo.size
    });

    // Process the file
    // Here you would implement your specific file processing logic
    // For example, parsing highlights, extracting text, etc.
    
    // For demonstration, we'll just re-upload the file
    await uploadObject(jobId + '_processed', fileData);

    // Mark progress as complete
    await setJobStatus(jobId, {
      state: 'completed',
      message: 'File processing completed',
      progress: fileInfo.size,
      total: fileInfo.size,
      completedAt: Date.now()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error processing file', { jobId, error: errorMessage });
    throw error;
  }
}
