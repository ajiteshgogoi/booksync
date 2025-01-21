import { parseClippings } from '../utils/parseClippings';
import { updateNotionDatabase } from './notionClient';
import { 
  redis,
  cacheHighlight,
  isHighlightCached,
  checkRateLimit,
  addJobToQueue,
  getJobStatus,
  JOB_TTL
} from './redisService';

// Configuration
const BATCH_SIZE = 10; // Number of highlights per batch
const BATCH_DELAY = 1000; // 1 second delay between batches

interface SyncJob {
  userId: string;
  fileContent: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total: number;
  error?: string;
}

export async function queueSyncJob(
  userId: string,
  fileContent: string
): Promise<string> {
  const jobId = `sync:${userId}:${Date.now()}`;
  const highlights = parseClippings(fileContent);
  
  const job: SyncJob = {
    userId,
    fileContent,
    status: 'pending',
    progress: 0,
    total: highlights.length
  };

  await redis.set(`job:${jobId}`, JSON.stringify(job), {
    ex: JOB_TTL
  });
  await addJobToQueue(jobId);
  
  return jobId;
}

export async function processSyncJob(jobId: string) {
  try {
    const job = await getJob(jobId);
    if (!job) throw new Error('Job not found');
    
    job.status = 'processing';
    await updateJob(jobId, job);

    const highlights = parseClippings(job.fileContent);
    
    for (let i = 0; i < highlights.length; i += BATCH_SIZE) {
      if (!await checkRateLimit(job.userId)) {
        throw new Error('Rate limit exceeded');
      }

      const batch = highlights.slice(i, i + BATCH_SIZE);
      const highlightsToSync = [];
      
      for (const highlight of batch) {
        if (!await isHighlightCached(job.userId, highlight.bookTitle, highlight)) {
          highlightsToSync.push(highlight);
        }
      }

      if (highlightsToSync.length > 0) {
        await updateNotionDatabase(job.userId, highlightsToSync);
        
        for (const highlight of highlightsToSync) {
          await cacheHighlight(job.userId, highlight.bookTitle, highlight);
          job.progress++;
          await updateJob(jobId, job);
        }
      }

      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }

    job.status = 'completed';
    await updateJob(jobId, job);
  } catch (error) {
    const job = await getJob(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await updateJob(jobId, job);
    }
    throw error;
  }
}

export async function getSyncStatus(jobId: string): Promise<SyncJob | null> {
  return await getJob(jobId);
}

async function getJob(jobId: string): Promise<SyncJob | null> {
  const job = await redis.get<string>(`job:${jobId}`);
  return job ? JSON.parse(job) : null;
}

async function updateJob(jobId: string, job: SyncJob) {
  await redis.set(`job:${jobId}`, JSON.stringify(job), {
    ex: JOB_TTL
  });
}
