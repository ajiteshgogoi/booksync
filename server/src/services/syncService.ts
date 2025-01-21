import { parseClippings } from '../utils/parseClippings';
import { updateNotionDatabase } from './notionClient';
import { 
  getRedis,
  cacheHighlight,
  isHighlightCached,
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
    await redis.set(key, value, { ex: JOB_TTL });
    
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
      if (!await checkRateLimit(highlights[i].userId)) {
        throw new Error('Rate limit exceeded');
      }

      const batch = highlights.slice(i, i + BATCH_SIZE);
      const highlightsToSync = [];
      
      // Filter out cached highlights
      for (const highlight of batch) {
        if (!await isHighlightCached(highlight.userId, highlight.bookTitle, highlight)) {
          highlightsToSync.push(highlight);
        }
      }

      // Sync highlights to Notion
      if (highlightsToSync.length > 0) {
        try {
          console.debug(`Processing batch of ${highlightsToSync.length} highlights`);
          
          // Verify all highlights have required fields
          const invalidHighlights = highlightsToSync.filter(h =>
            !h.userId || !h.bookTitle || !h.highlight || !h.location || !h.date
          );
          
          if (invalidHighlights.length > 0) {
            console.error('Found invalid highlights:', invalidHighlights);
            throw new Error('Some highlights are missing required fields');
          }

          // Verify all highlights have the same userId
          const userId = highlightsToSync[0].userId;
          if (!highlightsToSync.every(h => h.userId === userId)) {
            throw new Error('Batch contains highlights from multiple users');
          }

          console.debug(`Updating Notion database for user ${userId}`);
          await updateNotionDatabase(userId, highlightsToSync);
          
          // Only cache highlights after successful Notion update
          for (const highlight of highlightsToSync) {
            try {
              await cacheHighlight(highlight.userId, highlight.bookTitle, highlight);
              processed++;
              
              // Update progress
              const progress = Math.round((processed / total) * 100);
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
              console.error('Error caching highlight:', error, highlight);
              // Continue processing other highlights
            }
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
  const highlights: string[] = [];
  let cursor = 0;
  
  try {
    const pattern = `highlights:${jobId}:*`;
    console.debug(`Retrieving highlights for job ${jobId} with pattern: ${pattern}`);
    
    // First, check if keys exist
    const allKeys = await redis.keys(pattern);
    console.debug(`Found ${allKeys.length} keys matching pattern:`, allKeys);
    
    do {
      const [newCursor, chunk] = await redis.scan(
        cursor,
        { match: pattern, count: 100 }
      );
      
      console.debug(`Found ${chunk.length} highlight keys for job ${jobId}`);
      
      if (chunk.length > 0) {
        console.debug('Processing chunk keys:', chunk);
        const batch = await redis.mget<(string | null)[]>(...chunk);
        console.debug('Raw batch values:', batch);
        
        for (const [index, item] of batch.entries()) {
          if (item !== null) {
            try {
              // Try parsing to validate JSON before adding
              const parsed = JSON.parse(item);
              console.debug(`Valid JSON at index ${index}:`, parsed);
              highlights.push(item);
            } catch (error) {
              console.error(`Invalid JSON at index ${index}:`, item);
            }
          } else {
            console.debug(`Null value at index ${index}`);
          }
        }
      }
      
      cursor = parseInt(newCursor);
    } while (cursor !== 0);

    console.debug(`Total highlights retrieved: ${highlights.length}`);

    // Convert highlights back to objects, with error handling for each item
    return highlights.map((h, index) => {
      try {
        const parsed = JSON.parse(h);
        console.debug(`Successfully parsed highlight ${index + 1}/${highlights.length}`);
        return parsed;
      } catch (error) {
        console.error('Failed to parse highlight:', h);
        throw new Error(`Failed to parse highlight data at index ${index}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  } catch (error) {
    console.error('Error retrieving highlights from queue:', error);
    throw new Error(`Failed to retrieve highlights: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
