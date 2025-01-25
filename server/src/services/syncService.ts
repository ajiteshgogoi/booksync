import { parseClippings } from '../utils/parseClippings.js';
import { updateNotionDatabase, Highlight, getClient } from './notionClient.js';
import { logger } from '../utils/logger.js';
import {
  getRedis,
  checkRateLimit,
  addJobToQueue,
  getJobStatus,
  JOB_TTL,
  setJobStatus,
  redisPool,
  STREAM_NAME,
  getActiveUploadCount
} from './redisService.js';
import { UPLOAD_LIMITS } from '../config/uploadLimits.js';
import { JobStatus } from '../types/job.js';
import { getBookHighlightHashes, truncateHash } from '../utils/notionUtils.js';

// Extend Highlight interface to include processing-specific fields
interface ProcessedHighlight extends Highlight {
  databaseId: string;
}

// Configuration based on environment
const isProd = process.env.NODE_ENV === 'production';
const isGitHubAction = process.env.GITHUB_ACTIONS === 'true';

// Optimize settings based on environment
const BASE_BATCH_SIZE = isGitHubAction ? 50 : // Larger base batch size in GitHub Actions
                       isProd ? 3 : // Small batches in Vercel
                       10;  // Normal batches locally

// Dynamic batch size based on API response times
let currentBatchSize = BASE_BATCH_SIZE;
const MIN_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 100;
const BATCH_SIZE_ADJUSTMENT_FACTOR = 1.5;
const RESPONSE_TIME_THRESHOLD = 500; // ms

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
  fileContent: string,
  userId: string
): Promise<string> {
  let redis;
  try {
    logger.debug('Starting sync job', { databaseId });
    const jobId = `sync:${databaseId}:${Date.now()}`;
    const highlights = await parseClippings(fileContent);
    logger.debug('Parsed highlights', { count: highlights.length });

    // Get Notion client to check for existing highlights
    const notionClient = await getClient();

    // Group highlights by book title
    const bookHighlights = new Map<string, Highlight[]>();
    for (const highlight of highlights) {
      if (!bookHighlights.has(highlight.bookTitle)) {
        bookHighlights.set(highlight.bookTitle, []);
      }
      bookHighlights.get(highlight.bookTitle)!.push(highlight);
    }

    // Check for duplicates and filter them out before queueing
    const uniqueHighlights: Highlight[] = [];
    for (const [bookTitle, bookHighlightList] of bookHighlights.entries()) {
      // Get existing hashes for this book from Notion
      const existingHashes = await getBookHighlightHashes(notionClient, databaseId, bookTitle);
      logger.debug('Existing hashes for book', {
        bookTitle,
        existingHashCount: existingHashes.size,
        sampleHashes: Array.from(existingHashes).slice(0, 3)
      });

      // Filter out duplicates using truncated hashes
      const newHighlights = bookHighlightList.filter(h => {
        const truncatedHash = truncateHash(h.hash);
        const isDuplicate = existingHashes.has(truncatedHash);
        if (isDuplicate) {
          logger.debug('Skipping duplicate highlight', {
            hash: h.hash,
            truncatedHash,
            location: h.location,
            bookTitle: h.bookTitle
          });
        }
        return !isDuplicate;
      });

      logger.debug('Deduplication results', {
        bookTitle,
        originalCount: bookHighlightList.length,
        newCount: newHighlights.length,
        duplicatesSkipped: bookHighlightList.length - newHighlights.length
      });

      uniqueHighlights.push(...newHighlights);
    }

    logger.debug('Total unique highlights to queue', { count: uniqueHighlights.length });

    // Only proceed if we have unique highlights to process
    if (uniqueHighlights.length === 0) {
      logger.debug('No new unique highlights to process');
      await setJobStatus(jobId, {
        state: 'completed',
        progress: 100,
        message: 'No new highlights to process',
        total: 0,
        lastProcessedIndex: 0
      });
      return jobId;
    }

    redis = await getRedis();
    console.debug('Redis client initialized');
    
    // Use Redis pipeline for batch operations
    const pipeline = redis.pipeline();
    
    // Store highlights in chunks to reduce connection usage
    console.debug('Storing highlights in chunks...');
    const CHUNK_SIZE = 100;
    let storedCount = 0;
    
    for (let i = 0; i < uniqueHighlights.length; i += CHUNK_SIZE) {
      const chunk = uniqueHighlights.slice(i, i + CHUNK_SIZE);
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
    // Check active uploads before adding to queue
    const activeUploads = await getActiveUploadCount();
    logger.info('[Sync] Checking active uploads before queueing', { activeUploads });
    
    if (activeUploads >= UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
      logger.warn('[Sync] Upload limit reached', {
        activeUploads,
        maxUploads: UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS,
        status: 'GitHub trigger blocked'
      });
      throw new Error('Too many users are using the service right now. Please try again later.');
    }

    logger.info('[Sync] Upload limit check passed', {
      activeUploads,
      maxUploads: UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS,
      status: 'Proceeding with GitHub trigger'
    });
    
    await setJobStatus(jobId, {
      state: 'pending',
      progress: 0,
      message: 'Job queued',
      total: uniqueHighlights.length,
      lastProcessedIndex: 0,
      userId // Store userId with job status
    });
    
    await addJobToQueue(jobId, userId);
    return jobId;
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
  let jobUserId: string | undefined = undefined;
  const MAX_CONNECTION_RETRIES = 3;
  const RETRY_DELAY = 1000;

  // Get initial job status with improved retry logic for userId
  let initialStatus;
  let retryCount = 0;
  const MAX_USERID_RETRIES = 5; // Increased retries
  const USERID_RETRY_DELAY = 200; // Shorter initial delay
  
  while (retryCount < MAX_USERID_RETRIES) {
    try {
      // First try getting from job status
      initialStatus = await getJobStatus(jobId);
      jobUserId = initialStatus?.userId;
      
      if (!jobUserId) {
        // Then try getting from stream entry
        const redis = await getRedis();
        try {
          const streamData = await redis.xrange(STREAM_NAME, '-', '+');
          for (const [_, fields] of streamData) {
            const jobIdIndex = fields.indexOf('jobId');
            const userIdIndex = fields.indexOf('userId');
            if (jobIdIndex !== -1 && fields[jobIdIndex + 1] === jobId && userIdIndex !== -1) {
              jobUserId = fields[userIdIndex + 1];
              logger.info('Retrieved userId from Redis stream', { jobId, userId: jobUserId });
              // Update job status with found userId and ensure state is defined
              await setJobStatus(jobId, {
                ...initialStatus,
                state: initialStatus?.state || 'processing',
                userId: jobUserId
              });
              break;
            }
          }
        } finally {
          redisPool.release(redis);
        }
        
        if (!jobUserId) {
          logger.warn('userId not found, retrying...', {
            jobId,
            attempt: retryCount + 1,
            status: initialStatus,
            delay: USERID_RETRY_DELAY * Math.pow(1.5, retryCount)
          });
          
          if (retryCount === MAX_USERID_RETRIES - 1) {
            throw new Error('Cannot process job: userId not found after retries');
          }
          
          await new Promise(resolve => setTimeout(resolve, USERID_RETRY_DELAY * Math.pow(1.5, retryCount)));
          retryCount++;
          continue;
        }
      }
      break;
    } catch (error) {
      if (retryCount === MAX_USERID_RETRIES - 1) {
        throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      await new Promise(resolve => setTimeout(resolve, USERID_RETRY_DELAY * Math.pow(2, retryCount)));
      retryCount++;
    }
  }

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
    // Get Redis connection once and reuse
    redis = await getRedisWithRetry();
    
    // Get current progress with timeout
    const status = await Promise.race<JobStatus | null>([
      getJobStatus(jobId),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Job status retrieval timeout')), 5000)
      )
    ]);
    
    // Log status retrieval
    logger.info('Retrieved job status', {
      jobId,
      statusExists: !!status,
      lastProcessedIndex: status?.lastProcessedIndex
    });
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

    // Get initial job status to preserve userId
    const initialJobStatus = await getJobStatus(jobId);
    if (!initialJobStatus?.userId) {
      throw new Error('Cannot process job: userId not found in job status');
    }
    
    // Update status to processing while preserving userId
    await setJobStatus(jobId, {
      state: 'processing',
      progress: Math.round((currentProcessed / total) * 100),
      message: 'Processing highlights...',
      lastProcessedIndex: currentProcessed,
      userId: initialJobStatus.userId
    });

    // Log highlight state before batch processing
    const hashCounts = new Map<string, number>();
    highlightsToProcess.forEach(h => {
      hashCounts.set(h.hash, (hashCounts.get(h.hash) || 0) + 1);
    });

    // Log any duplicates in the batch
    const duplicateHashes = Array.from(hashCounts.entries())
      .filter(([_, count]) => count > 1);
    
    if (duplicateHashes.length > 0) {
      console.warn('Found duplicate hashes in batch to process:', {
        totalHighlights: highlightsToProcess.length,
        duplicateHashCount: duplicateHashes.length,
        duplicates: duplicateHashes.map(([hash, count]) => ({
          hash,
          count,
          highlights: highlightsToProcess
            .filter(h => h.hash === hash)
            .map(h => ({
              bookTitle: h.bookTitle,
              location: h.location,
              date: h.date
            }))
        }))
      });
    }

    // Process highlights in batches
    for (let i = 0; i < highlightsToProcess.length; i += currentBatchSize) {
      const batch = highlightsToProcess.slice(i, i + currentBatchSize);
      
      if (batch.length === 0) continue;
      
      if (!batch[0]?.databaseId) {
        console.error('Missing databaseId in highlight:', batch[0]);
        continue;
      }

      // Log batch details
      console.debug('Processing batch:', {
        batchIndex: Math.floor(i / currentBatchSize) + 1,
        batchSize: currentBatchSize,
        sampleHashes: batch.slice(0, 3).map(h => ({
          hash: h.hash,
          bookTitle: h.bookTitle,
          location: h.location
        }))
      });

      if (!await checkRateLimit(batch[0].databaseId)) {
        // Store progress and exit when rate limited
        // Get current status to preserve userId
        const currentStatus = await getJobStatus(jobId);
        if (!currentStatus?.userId) {
          throw new Error('Cannot process job: userId not found in job status');
        }
        
        await setJobStatus(jobId, {
          state: 'pending',
          progress: Math.round((currentProcessed / total) * 100),
          message: 'Rate limit reached - will resume in next run',
          lastProcessedIndex: currentProcessed,
          userId: currentStatus.userId
        });
        const userId = status?.userId;
        if (!userId) {
          throw new Error('Cannot requeue job: userId not found in job status');
        }
        await addJobToQueue(jobId, userId); // Re-queue for next run
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
          
          // Clean up processed Redis keys
          const keysToDelete = batch.map((_, index) =>
            `highlights:${jobId}:${i + index}`
          );
          await redis.del(...keysToDelete);
          
          // Update progress
          const progress = Math.round((currentProcessed / total) * 100);
          const progressMessage = `Processing ${currentProcessed}/${total} highlights`;
          
          // Get current status to preserve userId
          const currentStatus = await getJobStatus(jobId);
          if (!currentStatus?.userId) {
            throw new Error('Cannot update job progress: userId not found in job status');
          }
          
          await setJobStatus(jobId, {
            state: 'processing',
            progress,
            message: progressMessage,
            lastProcessedIndex: currentProcessed,
            userId: currentStatus.userId
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
    // Get job status to preserve userId
    const jobStatus = await getJobStatus(jobId);
    if (!jobStatus?.userId) {
      throw new Error('Cannot update job completion: userId not found in job status');
    }

    if (currentProcessed >= total) {
      const completionMessage = 'Sync completed successfully';
      await setJobStatus(jobId, {
        state: 'completed',
        progress: 100,
        message: completionMessage,
        lastProcessedIndex: total,
        userId: jobStatus.userId
      });
      logger.info('Highlights sync completed', {
        jobId,
        totalSynced: total,
        totalBatches: Math.ceil(total / currentBatchSize)
      });
    } else {
      // More to process in next run
      const progress = Math.round((currentProcessed / total) * 100);
      const pendingMessage = `Processed ${currentProcessed}/${total} highlights - will continue in next run`;
      await setJobStatus(jobId, {
        state: 'pending',
        progress,
        message: pendingMessage,
        lastProcessedIndex: currentProcessed,
        userId: jobStatus.userId
      });
      logger.info('Partial highlights sync completed', {
        jobId,
        progress,
        processedCount: currentProcessed,
        totalCount: total,
        remaining: total - currentProcessed
      });
      if (!jobUserId) {
        throw new Error('Cannot requeue job: userId is required');
      }
      await addJobToQueue(jobId, jobUserId);
    }
  } catch (error) {
    const errorStatus = await getJobStatus(jobId);
    const currentUserId = errorStatus?.userId || initialStatus?.userId || jobUserId;
    if (!currentUserId) {
      throw new Error('Cannot set error status: userId not found');
    }
    await setJobStatus(jobId, {
      state: 'failed',
      message: error instanceof Error ? error.message : 'Sync failed',
      lastProcessedIndex: errorStatus?.lastProcessedIndex || 0,
      userId: currentUserId
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
