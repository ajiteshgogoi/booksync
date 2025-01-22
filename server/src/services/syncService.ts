import { parseClippings } from '../utils/parseClippings';
import { updateNotionDatabase } from './notionClient';
import {
  getRedis,
  checkRateLimit,
  addJobToQueue,
  getJobStatus,
  JOB_TTL,
  setJobStatus,
  JobStatus
} from './redisService';

// Configuration
const BATCH_SIZE = 10; // Reduced batch size for faster processing
const BATCH_DELAY = 100; // Reduced delay between batches
const MAX_RETRIES = 3; // Maximum number of retries for failed batches

export async function queueSyncJob(
  databaseId: string,
  fileContent: string
): Promise<string> {
  console.debug('Starting sync job for database:', databaseId);
  const jobId = `sync:${databaseId}:${Date.now()}`;
  const highlights = parseClippings(fileContent);
  console.debug('Parsed highlights count:', highlights.length);
  const redis = await getRedis();
  console.debug('Redis client initialized');
  
  // Store highlights in Redis in chunks
  for (let i = 0; i < highlights.length; i++) {
    const highlight = highlights[i];
    // Add databaseId to the highlight
    const highlightWithDb = {
      ...highlight,
      databaseId
    };
    const key = `highlights:${jobId}:${i}`;
    const value = JSON.stringify(highlightWithDb);
    console.debug(`Storing highlight ${i + 1}/${highlights.length}:`, { key, value });
    await redis.set(key, value, 'EX', JOB_TTL);
    
    // Verify storage
    const stored = await redis.get(key);
    console.debug(`Verified storage for highlight ${i + 1}:`, { stored });
  }
  
  await setJobStatus(jobId, {
    state: 'pending',
    progress: 0,
    message: 'Job queued',
    total: highlights.length
  });
  
  await addJobToQueue(jobId);
  return jobId;
}

export async function processSyncJob(
  jobId: string,
  onProgress?: (progress: number, message: string) => Promise<void>
) {
  try {
    console.debug(`Starting sync job processing for ${jobId}`);
    const redis = await getRedis();
    
    // Update status to processing
    await setJobStatus(jobId, {
      state: 'processing',
      progress: 0,
      message: 'Starting sync...'
    });

    console.debug(`Retrieving highlights from queue for ${jobId}`);
    const highlights = await getHighlightsFromQueue(jobId);
    console.debug(`Retrieved ${highlights.length} highlights for processing`);

    const total = highlights.length;
    let processed = 0;

    for (let i = 0; i < highlights.length; i += BATCH_SIZE) {
      if (!highlights[i]?.databaseId) {
        console.error('Missing databaseId in highlight:', highlights[i]);
        continue;
      }

      if (!await checkRateLimit(highlights[i].databaseId)) {
        throw new Error('Rate limit exceeded');
      }

      const batch = highlights.slice(i, i + BATCH_SIZE);
      
      // Process batch of highlights with retry logic
      if (batch.length > 0) {
        let retryCount = 0;
        let success = false;

        while (!success && retryCount < MAX_RETRIES) {
          try {
            console.debug(`Processing batch of ${batch.length} highlights (attempt ${retryCount + 1}/${MAX_RETRIES})`);
            
            // Verify all highlights have required fields
            const invalidHighlights = batch.filter(h =>
              !h.databaseId || !h.bookTitle || !h.highlight || !h.location || !h.date
            );
            
            if (invalidHighlights.length > 0) {
              console.error('Found invalid highlights:', invalidHighlights);
              throw new Error('Some highlights are missing required fields');
            }

            // Verify all highlights have the same databaseId
            const dbId = batch[0].databaseId;
            if (!batch.every(h => h.databaseId === dbId)) {
              throw new Error('Batch contains highlights from multiple databases');
            }

            console.debug(`Updating Notion database with ${batch.length} highlights`);
            await updateNotionDatabase(batch);
            
            // Update progress
            processed += batch.length;
            const progress = Math.round((processed / total) * 100);
            
            // Update job status
            await setJobStatus(jobId, {
              state: 'processing',
              progress,
              message: `Processing ${processed}/${total} highlights`
            });
            
            // Call progress callback if provided
            if (onProgress) {
              await onProgress(progress, `Processing ${processed}/${total} highlights`);
            }

            success = true;
          } catch (error) {
            retryCount++;
            console.error(`Error syncing highlights to Notion (attempt ${retryCount}/${MAX_RETRIES}):`, error);
            
            if (retryCount === MAX_RETRIES) {
              await setJobStatus(jobId, {
                state: 'failed',
                message: `Failed to sync highlights to Notion after ${MAX_RETRIES} attempts`
              });
              throw error;
            }
            
            // Wait before retrying (exponential backoff)
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }

    // Mark job as completed
    await setJobStatus(jobId, {
      state: 'completed',
      progress: 100,
      message: 'Sync completed successfully'
    });
  } catch (error) {
    await setJobStatus(jobId, {
      state: 'failed',
      message: error instanceof Error ? error.message : 'Sync failed'
    });
    throw error;
  }
}

export async function getSyncStatus(jobId: string): Promise<JobStatus | null> {
  return await getJobStatus(jobId);
}

async function getHighlightsFromQueue(jobId: string) {
  const redis = await getRedis();
  const highlights = [];
  let cursor = 0;
  
  try {
    const pattern = `highlights:${jobId}:*`;
    console.debug(`Retrieving highlights for job ${jobId} with pattern: ${pattern}`);
    
    // First, check if keys exist
    const allKeys = await redis.keys(pattern);
    console.debug(`Found ${allKeys.length} keys matching pattern:`, allKeys);
    
    // Get all values at once instead of using scan
    if (allKeys.length > 0) {
      const batch = await redis.mget(...allKeys);
      console.debug('Raw batch values:', batch);
      
      for (const [index, item] of batch.entries()) {
        if (item !== null) {
          try {
            // Handle both string and object responses from Redis
            const highlight = typeof item === 'string' ? JSON.parse(item) : item;
            if (typeof highlight === 'object' && highlight.bookTitle && highlight.databaseId) {
              console.debug(`Valid highlight at index ${index}`);
              highlights.push(highlight);
            } else {
              console.error(`Invalid highlight structure at index ${index}:`, highlight);
            }
          } catch (error) {
            console.error(`Error processing highlight at index ${index}:`, error, item);
          }
        } else {
          console.debug(`Null value at index ${index}`);
        }
      }
    }

    console.debug(`Total valid highlights retrieved: ${highlights.length}`);
    return highlights;
  } catch (error) {
    console.error('Error retrieving highlights from queue:', error);
    throw error;
  }
}
