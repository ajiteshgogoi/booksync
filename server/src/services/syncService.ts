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
    await redis.set(
      `highlights:${jobId}:${i}`,
      JSON.stringify(highlights[i]),
      { ex: JOB_TTL }
    );
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
    const redis = await getRedis();
    // Update status to processing
    await setJobStatus(jobId, {
      state: 'processing',
      progress: 0,
      message: 'Starting sync...'
    });

    const highlights = await getHighlightsFromQueue(jobId);
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
          // Verify all highlights have the same userId
          const userId = highlightsToSync[0].userId;
          if (!highlightsToSync.every(h => h.userId === userId)) {
            throw new Error('Batch contains highlights from multiple users');
          }
          await updateNotionDatabase(userId, highlightsToSync);
          
          // Only cache highlights after successful Notion update
          for (const highlight of highlightsToSync) {
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
  
  do {
    const [newCursor, chunk] = await redis.scan(
      cursor,
      { match: `highlights:${jobId}:*`, count: 100 }
    );
    
    if (chunk.length > 0) {
      const batch = await redis.mget<string[]>(...chunk);
      highlights.push(...batch.filter(Boolean));
    }
    
    cursor = parseInt(newCursor);
  } while (cursor !== 0);

  return highlights.map(h => JSON.parse(h));
}
