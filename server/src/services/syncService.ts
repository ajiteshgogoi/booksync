import { updateNotionDatabase, Highlight, getClient } from './notionClient.js';
import { logger } from '../utils/logger.js';
import { jobStateService } from './jobStateService.js';
import { getBookHighlightHashes, truncateHash } from '../utils/notionUtils.js';
import { tempStorageService } from './tempStorageService.js';

// Configuration based on environment
const isProd = process.env.NODE_ENV === 'production';
const isGitHubAction = process.env.GITHUB_ACTIONS === 'true';

// Optimize settings based on environment
const BASE_BATCH_SIZE = isGitHubAction ? 50 : // Larger base batch size in GitHub Actions
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
  fileContent: string,
  userId: string
): Promise<string> {
  try {
    logger.debug('Starting sync job', { databaseId });
    
    const jobId = `sync:${userId}:${Date.now()}`;
    
    // Store initial processing state
    await tempStorageService.storeProcessingState(jobId, {
      databaseId,
      userId,
      stage: 'initialization',
      progress: 0
    });

    // Update job state to queued when starting processing
    await jobStateService.updateJobState(jobId, {
      state: 'queued',
      message: 'Starting file processing',
      progress: 0
    });

    // Get Notion client to check for existing highlights
    const notionClient = await getClient();

    // Get highlights from temp storage
    const bookHighlights = await tempStorageService.getHighlights(jobId);
    const bookMap = new Map<string, Highlight[]>();
    
    for (const highlight of bookHighlights) {
      if (!bookMap.has(highlight.bookTitle)) {
        bookMap.set(highlight.bookTitle, []);
      }
      bookMap.get(highlight.bookTitle)!.push(highlight);
    }

    // Check for duplicates and filter them out
    const uniqueHighlights: Highlight[] = [];
    for (const [bookTitle, bookHighlightList] of bookMap.entries()) {
      // Get existing hashes for this book from Notion
      const existingHashes = await getBookHighlightHashes(notionClient, databaseId, bookTitle);
      logger.debug('Existing hashes for book', {
        bookTitle,
        existingHashCount: existingHashes.size
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

      uniqueHighlights.push(...newHighlights);
    }

    logger.debug('Total unique highlights to queue', { count: uniqueHighlights.length });

    // Store unique highlights back to temp storage
    await tempStorageService.storeHighlights(jobId, uniqueHighlights);

    // Update job state to parsed after successful processing
    await jobStateService.updateJobState(jobId, {
      state: 'parsed',
      message: uniqueHighlights.length > 0 
        ? `Found ${uniqueHighlights.length} new highlights to process`
        : 'No new highlights to process',
      total: uniqueHighlights.length,
      progress: 0
    });

    return jobId;
  } catch (error) {
    logger.error('Error queueing sync job:', error);
    throw error;
  }
}

export async function processSyncJob(
  jobId: string,
  onProgress?: (progress: number, message: string) => Promise<void>
) {
  try {
    logger.info(`Starting sync job processing`, { jobId });

    // Get processing state
    const state = await tempStorageService.getProcessingState(jobId);
    if (!state?.databaseId) {
      throw new Error('Invalid processing state');
    }

    // Get highlights from temp storage
    const highlights = await tempStorageService.getHighlights(jobId);
    const total = highlights.length;

    if (total === 0) {
      await jobStateService.updateJobState(jobId, {
        state: 'completed',
        progress: 100,
        message: 'No highlights to process'
      });
      return;
    }

    // Process highlights in batches
    let currentProcessed = 0;

    for (let i = 0; i < highlights.length; i += BASE_BATCH_SIZE) {
      const batch = highlights.slice(i, i + BASE_BATCH_SIZE);
      
      if (batch.length === 0) continue;

      // Process batch with retry logic
      let retryCount = 0;
      let success = false;

      while (!success && retryCount < MAX_RETRIES) {
        try {
          await updateNotionDatabase(batch.map(h => ({
            ...h,
            databaseId: state.databaseId
          })));

          currentProcessed += batch.length;
          
          // Update progress
          const progress = Math.round((currentProcessed / total) * 100);
          const progressMessage = `Processing ${currentProcessed}/${total} highlights`;
          
          await jobStateService.updateJobState(jobId, {
            state: 'processing',
            progress,
            message: progressMessage
          });
          
          if (onProgress) {
            await onProgress(progress, progressMessage);
          }

          success = true;
        } catch (error) {
          retryCount++;
          logger.error(`Error syncing highlights to Notion (attempt ${retryCount}/${MAX_RETRIES}):`, error);
          
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

    // Update final state
    await jobStateService.updateJobState(jobId, {
      state: 'completed',
      progress: 100,
      message: 'Sync completed successfully'
    });

    logger.info('Highlights sync completed', {
      jobId,
      totalSynced: total,
      totalBatches: Math.ceil(total / BASE_BATCH_SIZE)
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await jobStateService.updateJobState(jobId, {
      state: 'failed',
      message: `Sync failed: ${errorMessage}`,
      errorDetails: errorMessage
    });
    throw error;
  }
}

export async function getSyncStatus(jobId: string) {
  return await jobStateService.getJobState(jobId);
}
