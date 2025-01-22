import { getRedis, getNextJob, setJobStatus, getJobStatus, addJobToQueue, JobStatus } from './services/redisService.js';
import { processSyncJob } from './services/syncService.js';

// Configuration for worker behavior
const isGitHubAction = process.env.GITHUB_ACTIONS === 'true';
const isProd = process.env.NODE_ENV === 'production';

// Environment-specific limits
const MAX_JOBS_PER_RUN = isGitHubAction ? 200 :   // Process more jobs in GitHub Actions
                        isProd ? 25 : Infinity;   // Limited in Vercel, unlimited locally
                        
const MAX_JOBS_PER_USER = isGitHubAction ? 2 :    // 2 uploads per user per workflow run
                         isProd ? 2 : Infinity;   // Limited in production, unlimited locally
                         
const MAX_RUNTIME = isGitHubAction ? 21000000 :   // ~6 hours in GitHub Actions
                   isProd ? 50000 :              // Under 1 minute in Vercel
                   Infinity;                      // No runtime limit locally (changed from 0)
                   
const JOB_TIMEOUT = isGitHubAction ? 3600000 :    // 1 hour per job in GitHub Actions
                   isProd ? 45000 :              // 45s in Vercel
                   3600000;                      // 1 hour timeout locally

// Track processed users for fair distribution
const processedUsers = new Set<string>();

export const startWorker = async () => {
  console.log('Starting sync worker...');
  console.log('Environment:', {
    isGitHubAction,
    isProd,
    MAX_JOBS_PER_RUN,
    MAX_JOBS_PER_USER,
    MAX_RUNTIME,
    JOB_TIMEOUT
  });
  
  const startTime = Date.now();
  let jobsProcessed = 0;

  // Test Redis connection first
  try {
    const redis = await getRedis();
    console.log('Redis connection test:', await redis.ping());
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return;
  }

  // Process jobs until we hit limits
  while (jobsProcessed < MAX_JOBS_PER_RUN && (MAX_RUNTIME === Infinity || (Date.now() - startTime) < MAX_RUNTIME)) {
    try {
      console.log('Attempting to get next job...');
      const jobId = await getNextJob();
      console.log('getNextJob result:', jobId);
      
      if (!jobId) {
        console.log('No more jobs to process');
        break;
      }

      // Extract user ID from job ID (format: sync:userId:timestamp)
      const userId = jobId.split(':')[1];
      
      // Skip if we've already processed max jobs for this user
      if (processedUsers.has(userId) &&
          Array.from(processedUsers).filter(id => id === userId).length >= MAX_JOBS_PER_USER) {
        console.log(`Skipping job ${jobId}: User ${userId} has reached their processing limit`);
        continue;
      }

      console.log(`Processing job ${jobId} for user ${userId}`);
      processedUsers.add(userId);
      jobsProcessed++;

      try {
        // Check job status before processing
        const currentStatus = await getJobStatus(jobId);
        console.log('Current job status:', currentStatus);

        if (currentStatus?.state === 'completed') {
          console.log(`Job ${jobId} is already completed, skipping`);
          continue;
        }

        if (isProd || isGitHubAction) {
          // Use timeout only in production or GitHub Actions
          const jobTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Job timeout')), JOB_TIMEOUT);
          });

          await Promise.race([
            processJobWithStatus(jobId),
            jobTimeout
          ]);
        } else {
          // In local development, run without timeout
          await processJobWithStatus(jobId);
        }

        console.log('Job completed successfully:', jobId);
      } catch (error) {
        console.error('Error processing job:', jobId, error);
        const status = await getJobStatus(jobId);
        
        if (error instanceof Error && error.message === 'Job timeout') {
          // If job timed out, requeue it to continue from last processed index
          await setJobStatus(jobId, {
            state: 'pending',
            message: 'Job timed out - will continue in next run',
            lastProcessedIndex: status?.lastProcessedIndex || 0
          });
          await addJobToQueue(jobId);
        } else if (error instanceof Error && error.message.includes('Notion')) {
          await setJobStatus(jobId, {
            state: 'failed',
            message: 'Failed to sync with Notion. Please ensure you have copied the Kindle Highlights template and granted necessary permissions.',
            lastProcessedIndex: status?.lastProcessedIndex || 0
          });
        } else {
          // For other errors, mark as failed but preserve progress
          await setJobStatus(jobId, {
            state: 'failed',
            message: error instanceof Error ? error.message : 'Unknown error',
            lastProcessedIndex: status?.lastProcessedIndex || 0
          });
        }
      }
    } catch (error) {
      console.error('Error in worker loop:', error);
      break;
    }
  }

  console.log(`Worker finished. Processed ${jobsProcessed} jobs in ${Date.now() - startTime}ms`);
}

async function processJobWithStatus(jobId: string): Promise<void> {
  // Get initial status
  const initialStatus = await getJobStatus(jobId);
  console.debug('Initial job status:', initialStatus);

  // Update status to show we're starting
  await setJobStatus(jobId, {
    state: 'processing',
    progress: 0,
    message: 'Starting to process highlights...'
  });

  await processSyncJob(jobId, async (progress, message) => {
    const newStatus = {
      state: 'processing' as const,
      progress,
      message
    };
    console.debug(`Job ${jobId} progress update:`, newStatus);
    await setJobStatus(jobId, newStatus);
  });

  // Mark as completed
  const completedStatus: JobStatus = {
    state: 'completed',
    progress: 100,
    message: 'Successfully synced all highlights to Notion'
  };
  await setJobStatus(jobId, completedStatus);
}
