import { parseClippings } from '../utils/parseClippings.js';
import { addJobToQueue, setJobStatus, getRedis, JOB_TTL } from './redisService.js';

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
    const highlights = await parseClippings(fileContent);
    console.log('Parsed highlights count:', highlights.length);
    
    // Use Redis pipeline for batch operations
    const pipeline = redis.pipeline();
    
    // Store all highlights in a single pipeline
    console.log('Storing highlights in pipeline...');
    highlights.forEach((highlight: any, i: number) => {
      const highlightWithDb = {
        ...highlight,
        databaseId
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
      total: highlights.length,
      lastProcessedIndex: 0
    }, redis);

    // Execute pipeline and add job to queue
    console.log('Executing Redis pipeline...');
    try {
      const pipelineResults = await pipeline.exec();
      if (!pipelineResults) {
        throw new Error('Pipeline execution returned no results');
      }
      
      // Check for pipeline errors
      const errors = pipelineResults.filter(result => result[0]);
      if (errors.length > 0) {
        console.error('Pipeline errors:', errors);
        throw new Error(`Failed to store ${errors.length} highlights`);
      }
      
      console.log('Pipeline executed successfully:', {
        total: highlights.length,
        success: pipelineResults.length - errors.length
      });
      
      await addJobToQueue(jobId, redis);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';
      console.error('Pipeline execution failed:', errorMessage);
      throw new Error(`Failed to store highlights: ${errorMessage}`);
    }
    
    console.log('File processing completed. Job ID:', jobId);
    return jobId;
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}
