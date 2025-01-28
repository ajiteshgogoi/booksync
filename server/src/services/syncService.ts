import { updateNotionDatabase, Highlight, getClient } from './notionClient.js';
import { logger } from '../utils/logger.js';
import { jobStateService } from './jobStateService.js';
import { getBookHighlightHashes, truncateHash } from '../utils/notionUtils.js';
import { tempStorageService } from './tempStorageService.js';
import { startUpload, addJobToUpload, completeJob } from './uploadTrackingService.js';
import { queueService } from './queueService.js';

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
  userId: string,
  highlights: Highlight[]
): Promise<string> {
  try {
    logger.debug('Starting sync job', { databaseId });
    
    const uploadId = `upload:${userId}:${Date.now()}`;
    const baseJobId = `sync:${userId}:${Date.now()}`;
    
    // Store initial processing state for first job
    await tempStorageService.storeProcessingState(baseJobId, {
      databaseId,
      userId,
      uploadId,
      stage: 'initialization',
      progress: 0
    });

    // Update job state to pending when starting
    await jobStateService.updateJobState(baseJobId, {
      state: 'pending',
      message: 'Starting file processing',
      progress: 0,
      userId: userId,
      uploadId: uploadId
    });

    // Initialize upload tracking
    await startUpload(userId, uploadId, 0); // we'll update total count after parsing

    // Get Notion client to check for existing highlights
    const notionClient = await getClient();

    // Group highlights by book title
    const bookMap = new Map<string, Highlight[]>();
    for (const highlight of highlights) {
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

    // Update upload with total highlight count
    await startUpload(userId, uploadId, uniqueHighlights.length);

    // Split highlights into chunks of 1000 if needed
    const chunks = [];
    const MAX_HIGHLIGHTS = 1000;
    for (let i = 0; i < uniqueHighlights.length; i += MAX_HIGHLIGHTS) {
      chunks.push(uniqueHighlights.slice(i, i + MAX_HIGHLIGHTS));
    }

    // Create jobs for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkJobId = chunks.length === 1 ? baseJobId : `${baseJobId}_${i + 1}`;
      
      // Store chunk highlights in temp storage
      await tempStorageService.storeHighlights(chunkJobId, chunk);

      // Add job to queue with queued state
     await jobStateService.updateJobState(chunkJobId, {
       state: 'queued',
       message: `Chunk ${i + 1}/${chunks.length}: Found ${chunk.length} highlights to process`,
       total: chunk.length,
       progress: 0,
       userId: userId,
       uploadId: uploadId
     });

     // Add to queue
     await queueService.addToQueue(chunkJobId, userId);
     logger.debug('Job queued for processing', { chunkJobId });

     // Update to parsed state after successful queue addition
     await jobStateService.updateJobState(chunkJobId, {
       state: 'parsed',
       message: `Ready to process ${chunk.length} highlights`,
       total: chunk.length,
       progress: 0,
       userId: userId,
       uploadId: uploadId
     });
      // Add job to upload tracking
      await addJobToUpload(uploadId, chunkJobId, chunk.length);
      
      logger.debug('Job prepared for GitHub processing', {
        chunkJobId,
        highlightCount: chunk.length
      });
    }

    // Mark user as active after all jobs are queued
    await queueService.addToActiveUsers(userId, uploadId); // Track the upload, not individual jobs

    return baseJobId;
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

   // Extract uploadId from jobId format (sync:userId:timestamp or sync:userId:timestamp_chunkNum)
   const uploadId = jobId.replace(/^sync:/, 'upload:').split('_')[0]; // Remove chunk number if present
   const isUploadComplete = await completeJob(uploadId, jobId);

   logger.info('Highlights sync completed', {
     jobId,
     uploadId,
     isUploadComplete,
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

   // Extract uploadId and mark job as complete even on failure
   const uploadId = jobId.replace(/^sync:/, 'upload:').split('_')[0];
   await completeJob(uploadId, jobId);

   throw error;
 }
}

export async function getSyncStatus(jobId: string) {
  return await jobStateService.getJobState(jobId);
}
