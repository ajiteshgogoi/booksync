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

// Configuration based on environment
const isProd = process.env.NODE_ENV === 'production';
const isGitHubAction = process.env.GITHUB_ACTIONS === 'true';

// Optimize settings based on environment
const BATCH_SIZE = isGitHubAction ? 25 : // Large batches in GitHub Actions
                  isProd ? 3 : // Small batches in Vercel
                  10;  // Normal batches locally

const BATCH_DELAY = isGitHubAction ? 200 : // Normal delay in GitHub Actions
                   isProd ? 10 : // Minimal delay in Vercel
                   100;  // Normal delay locally

const MAX_RETRIES = isGitHubAction ? 3 : // More retries in GitHub Actions
                   isProd ? 1 : // Single retry in Vercel
                   3;   // Normal retries locally

const MAX_HIGHLIGHTS_PER_RUN = isGitHubAction ? 1000 : // Process up to 1000 in GitHub Actions
                              isProd ? 15 : // Limited in Vercel
                              Infinity; // No limit locally

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
    total: highlights.length,
    lastProcessedIndex: 0
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
    
    // Get current progress
    const status = await getJobStatus(jobId);
    const lastProcessedIndex = status?.lastProcessedIndex || 0;
    
    // Get all highlights
    const highlights = await getHighlightsFromQueue(jobId);
    const total = highlights.length;
    
    if (lastProcessedIndex >= total) {
      console.debug('All highlights already processed');
      await setJobStatus(jobId, {
        state: 'completed',
        progress: 100,
        message: 'Sync completed successfully',
        lastProcessedIndex: total
      });
      return;
    }

    // Process only a chunk of highlights in this run
    const endIndex = Math.min(lastProcessedIndex + MAX_HIGHLIGHTS_PER_RUN, total);
    const highlightsToProcess = highlights.slice(lastProcessedIndex, endIndex);
    let currentProcessed = lastProcessedIndex;

    // Update status to processing
    await setJobStatus(jobId, {
      state: 'processing',
      progress: Math.round((currentProcessed / total) * 100),
      message: 'Processing highlights...',
      lastProcessedIndex: currentProcessed
    });

    // Process highlights in batches
    for (let i = 0; i < highlightsToProcess.length; i += BATCH_SIZE) {
      const batch = highlightsToProcess.slice(i, i + BATCH_SIZE);
      
      if (batch.length === 0) continue;
      
      if (!batch[0]?.databaseId) {
        console.error('Missing databaseId in highlight:', batch[0]);
        continue;
      }

      if (!await checkRateLimit(batch[0].databaseId)) {
        // Store progress and exit when rate limited
        await setJobStatus(jobId, {
          state: 'pending',
          progress: Math.round((currentProcessed / total) * 100),
          message: 'Rate limit reached - will resume in next run',
          lastProcessedIndex: currentProcessed
        });
        await addJobToQueue(jobId); // Re-queue for next run
        return;
      }

      // Process batch with retry logic
      let retryCount = 0;
      let success = false;

      while (!success && retryCount < MAX_RETRIES) {
        try {
          // Verify all highlights have required fields and same database
          const invalidHighlights = batch.filter(h =>
            !h.databaseId || !h.bookTitle || !h.highlight || !h.location || !h.date
          );
          
          if (invalidHighlights.length > 0) {
            throw new Error('Some highlights are missing required fields');
          }

          const dbId = batch[0].databaseId;
          if (!batch.every(h => h.databaseId === dbId)) {
            throw new Error('Batch contains highlights from multiple databases');
          }

          await updateNotionDatabase(batch);
          currentProcessed += batch.length;
          
          // Update progress
          const progress = Math.round((currentProcessed / total) * 100);
          await setJobStatus(jobId, {
            state: 'processing',
            progress,
            message: `Processing ${currentProcessed}/${total} highlights`,
            lastProcessedIndex: currentProcessed
          });
          
          if (onProgress) {
            await onProgress(progress, `Processing ${currentProcessed}/${total} highlights`);
          }

          success = true;
        } catch (error) {
          retryCount++;
          console.error(`Error syncing highlights to Notion (attempt ${retryCount}/${MAX_RETRIES}):`, error);
          
          if (retryCount === MAX_RETRIES) {
            throw error;
          }
          
          // Wait before retrying (exponential backoff)
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }

      // Add delay between batches to avoid overwhelming Notion API
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }

    // Check if we've processed everything
    if (currentProcessed >= total) {
      await setJobStatus(jobId, {
        state: 'completed',
        progress: 100,
        message: 'Sync completed successfully',
        lastProcessedIndex: total
      });
    } else {
      // More to process in next run
      await setJobStatus(jobId, {
        state: 'pending',
        progress: Math.round((currentProcessed / total) * 100),
        message: `Processed ${currentProcessed}/${total} highlights - will continue in next run`,
        lastProcessedIndex: currentProcessed
      });
      await addJobToQueue(jobId);
    }
  } catch (error) {
    const currentStatus = await getJobStatus(jobId);
    await setJobStatus(jobId, {
      state: 'failed',
      message: error instanceof Error ? error.message : 'Sync failed',
      lastProcessedIndex: currentStatus?.lastProcessedIndex || 0
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
