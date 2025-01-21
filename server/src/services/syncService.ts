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
const BATCH_SIZE = 25; // Number of highlights per batch
const BATCH_DELAY = 500; // 500ms delay between batches

export async function queueSyncJob(
  userId: string,
  fileContent: string
): Promise<string> {
  console.debug('Starting sync job for user:', userId);
  const jobId = `sync:${userId}:${Date.now()}`;
  const highlights = parseClippings(fileContent);
  console.debug('Parsed highlights count:', highlights.length);
  const redis = await getRedis();
  console.debug('Redis client initialized');
  
  // Store highlights in Redis in chunks
  for (let i = 0; i < highlights.length; i++) {
    const highlight = highlights[i];
    // Add userId by creating a new object that includes all highlight properties plus userId
    const highlightWithUser = {
      ...highlight,
      userId
    };
    const key = `highlights:${jobId}:${i}`;
    const value = JSON.stringify(highlightWithUser);
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
      if (!highlights[i]?.userId) {
        console.error('Missing userId in highlight:', highlights[i]);
        continue;
      }

      if (!await checkRateLimit(highlights[i].userId)) {
        throw new Error('Rate limit exceeded');
      }

      const batch = highlights.slice(i, i + BATCH_SIZE);
      
      // Process batch of highlights
      if (batch.length > 0) {
        try {
          console.debug(`Processing batch of ${batch.length} highlights`);
          
          // Verify all highlights have required fields
          const invalidHighlights = batch.filter(h =>
            !h.userId || !h.bookTitle || !h.highlight || !h.location || !h.date
          );
          
          if (invalidHighlights.length > 0) {
            console.error('Found invalid highlights:', invalidHighlights);
            throw new Error('Some highlights are missing required fields');
          }

          // Verify all highlights have the same userId
          const userId = batch[0].userId;
          if (!batch.every(h => h.userId === userId)) {
            throw new Error('Batch contains highlights from multiple users');
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
        } catch (error) {
          console.error('Error syncing highlights to Notion:', error);
          await setJobStatus(jobId, {
            state: 'failed',
            message: 'Failed to sync highlights to Notion'
          });
          throw error;
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
            if (typeof highlight === 'object' && highlight.bookTitle && highlight.userId) {
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
