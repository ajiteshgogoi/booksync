import { parseClippings, Highlight as ParsedHighlight } from '../utils/parseClippings.js';
import { addJobToQueue, setJobStatus, getRedis, JOB_TTL } from './redisService.js';

interface HighlightWithDb extends ParsedHighlight {
  databaseId: string;
  version: number;
}

export async function processFileContent(
  userId: string,
  fileContent: string,
  databaseId: string
): Promise<string> {
  const redis = await getRedis();
  
  try {
    console.log('Starting file processing for user:', userId);
    const jobId = `sync:${userId}:${Date.now()}`;
    
    // Parse all highlights at once
    const parsedHighlights = await parseClippings(fileContent);
    console.log('Parsed highlights count:', parsedHighlights.length);
    
    // Use Redis pipeline for batch operations
    const pipeline = redis.pipeline();
    
    // Store all highlights in a single pipeline
    console.log('Storing highlights in pipeline...');
    parsedHighlights.forEach((highlight: ParsedHighlight, i: number) => {
      const highlightWithDb: HighlightWithDb = {
        ...highlight,
        databaseId,
        version: 1
      };
      const key = `highlights:${jobId}:${i}`;
      pipeline.set(key, JSON.stringify(highlightWithDb), 'EX', JOB_TTL);
    });

    // Set initial job status
    console.log('Setting job status...');
    await setJobStatus(jobId, {
      state: 'pending',
      progress: 0,
      message: 'File processed, highlights queued',
      total: parsedHighlights.length,
      lastProcessedIndex: 0
    });

    // Execute pipeline and add job to queue
    console.log('Executing Redis pipeline...');
    await pipeline.exec();
    await addJobToQueue(jobId);
    
    console.log('File processing completed. Job ID:', jobId);
    
    // Close Redis connection
    redis.quit();
    
    return jobId;
  } catch (error) {
    console.error('Error processing file:', error);
    
    // Close Redis connection on error
    redis.quit();
    
    throw error;
  }
}