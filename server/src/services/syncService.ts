import { parseClippings } from '../utils/parseClippings.js';
import { updateNotionDatabase, Highlight } from './notionClient.js';
import { logger } from '../utils/logger.js';
import {
  getRedis,
  checkRateLimit,
  addJobToQueue,
  getJobStatus,
  JOB_TTL,
  setJobStatus,
  JobStatus,
  redisPool
} from './redisService.js';

// Extend Highlight interface to include processing-specific fields
interface ProcessedHighlight extends Highlight {
  databaseId: string;
}

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
  let redis;
  try {
    console.debug('Starting sync job for database:', databaseId);
    const jobId = `sync:${databaseId}:${Date.now()}`;
    const highlights = await parseClippings(fileContent);
    console.debug('Parsed highlights count:', highlights.length);
    redis = await getRedis();
    console.debug('Redis client initialized');
    
    // Use Redis pipeline for batch operations
    const pipeline = redis.pipeline();
    
    // Store highlights in chunks to reduce connection usage
    console.debug('Storing highlights in chunks...');
    const CHUNK_SIZE = 100;
    let storedCount = 0;
    
    for (let i = 0; i < highlights.length; i += CHUNK_SIZE) {
      const chunk = highlights.slice(i, i + CHUNK_SIZE);
      const chunkPipeline = redis.pipeline();
      
      chunk.forEach((highlight, chunkIndex) => {
        const highlightWithDb = {
          ...highlight,
          databaseId
        };
        const key = `highlights:${jobId}:${i + chunkIndex}`;
        chunkPipeline.set(key, JSON.stringify(highlightWithDb), 'EX', JOB_TTL);
      });
      
      // Execute and clear pipeline for each chunk
      const results = await chunkPipeline.exec();
      
      // Check for errors
      if (results) {
        const errors = results
          .filter(([err]) => err)
          .map(([err], index) => `Operation ${index}: ${err}`);
          
        if (errors.length > 0) {
          throw new Error(`Chunk storage errors: ${errors.join(', ')}`);
        }
      }
      
      storedCount += chunk.length;
      console.debug(`Stored chunk ${i / CHUNK_SIZE + 1}, total stored: ${storedCount}`);
    }

    // Execute pipeline with error handling
    console.debug('Executing Redis pipeline...');
    const results = await pipeline.exec();
    
    // Check pipeline results for errors
    if (!results) {
      throw new Error('Pipeline execution failed - no results returned');
    }
    
    const errors = results
      .filter(([err]) => err)
      .map(([err], index) => `Operation ${index}: ${err}`);
      
    if (errors.length > 0) {
      throw new Error(`Pipeline errors: ${errors.join(', ')}`);
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
  } finally {
    // Return connection to pool
    if (redis) {
      redisPool.release(redis);
    }
  }
}

export async function processSyncJob(
  jobId: string,
  onProgress?: (progress: number, message: string) => Promise<void>
) {
  let redis;
  let retries = 0;
  const MAX_CONNECTION_RETRIES = 3;
  const RETRY_DELAY = 1000;

  const getRedisWithRetry = async () => {
    for (let i = 0; i < MAX_CONNECTION_RETRIES; i++) {
      try {
        return await getRedis();
      } catch (error) {
        if (i === MAX_CONNECTION_RETRIES - 1) throw error;
        console.warn(`Redis connection attempt ${i + 1} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)));
      }
    }
    throw new Error('Failed to connect to Redis after retries');
  };

  try {
    logger.info(`Starting sync job processing`, { jobId });
    redis = await getRedisWithRetry();
    
    // Get current progress with retry
    let status;
    try {
      status = await getJobStatus(jobId);
    } catch (error) {
      logger.warn('Failed to get job status, retrying...', { jobId, error });
      redis = await getRedisWithRetry();
      status = await getJobStatus(jobId);
    }
    const lastProcessedIndex = status?.lastProcessedIndex || 0;
    
    // Get all highlights with retry
    let highlights;
    try {
      highlights = await getHighlightsFromQueue(jobId);
    } catch (error) {
      logger.warn('Failed to get highlights from queue, retrying...', { jobId, error });
      redis = await getRedisWithRetry();
      highlights = await getHighlightsFromQueue(jobId);
    }
    const total = highlights.length;
    
    logger.info('Retrieved highlights for processing', { jobId, total, lastProcessedIndex });
    
    if (lastProcessedIndex >= total) {
      logger.info('All highlights already processed', { jobId });
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
          const progressMessage = `Processing ${currentProcessed}/${total} highlights`;
          
          await setJobStatus(jobId, {
            state: 'processing',
            progress,
            message: progressMessage,
            lastProcessedIndex: currentProcessed
          });
          
          // Log batch completion
          logger.info('Batch synced to Notion', {
            jobId,
            batchSize: batch.length,
            currentProcessed,
            total,
            progress
          });
          
          if (onProgress) {
            await onProgress(progress, progressMessage);
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
      const completionMessage = 'Sync completed successfully';
      await setJobStatus(jobId, {
        state: 'completed',
        progress: 100,
        message: completionMessage,
        lastProcessedIndex: total
      });
      logger.info('Highlights sync completed', {
        jobId,
        totalSynced: total,
        totalBatches: Math.ceil(total / BATCH_SIZE)
      });
    } else {
      // More to process in next run
      const progress = Math.round((currentProcessed / total) * 100);
      const pendingMessage = `Processed ${currentProcessed}/${total} highlights - will continue in next run`;
      await setJobStatus(jobId, {
        state: 'pending',
        progress,
        message: pendingMessage,
        lastProcessedIndex: currentProcessed
      });
      logger.info('Partial highlights sync completed', {
        jobId,
        progress,
        processedCount: currentProcessed,
        totalCount: total,
        remaining: total - currentProcessed
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
  } finally {
    // Return connection to pool
    if (redis) {
      redisPool.release(redis);
    }
  }
}

async function getHighlightsFromQueue(jobId: string): Promise<ProcessedHighlight[]> {
  let redis;
  const highlights: ProcessedHighlight[] = [];
  const CHUNK_SIZE = 100;
  
  try {
    redis = await getRedis();
    const pattern = `highlights:${jobId}:*`;
    console.debug(`Retrieving highlights for job ${jobId} with pattern: ${pattern}`);
    
    // First, check if keys exist
    const allKeys = await redis.keys(pattern);
    console.debug(`Found ${allKeys.length} keys matching pattern:`, allKeys);
    
    // Process keys in chunks to reduce memory and connection usage
    for (let i = 0; i < allKeys.length; i += CHUNK_SIZE) {
      const chunkKeys = allKeys.slice(i, i + CHUNK_SIZE);
      const pipeline = redis.pipeline();
      
      chunkKeys.forEach(key => pipeline.get(key));
      const results = await pipeline.exec();
      
      if (results) {
        results.forEach(([err, item], index) => {
          if (err) {
            console.error(`Error getting value at index ${index}:`, err);
            return;
          }
          
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
        });
      }
    }

    console.debug(`Total valid highlights retrieved: ${highlights.length}`);
    return highlights;
  } catch (error) {
    console.error('Error retrieving highlights from queue:', error);
    throw error;
  } finally {
    // Return connection to pool
    if (redis) {
      redisPool.release(redis);
    }
  }
}

export async function getSyncStatus(jobId: string): Promise<JobStatus | null> {
  return await getJobStatus(jobId);
}
