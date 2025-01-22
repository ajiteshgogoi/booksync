import { getRedis, getNextJob, setJobStatus, getJobStatus, addJobToQueue, JobStatus } from './services/redisService';
import { processSyncJob } from './services/syncService';

// Configuration for worker behavior
const isProd = process.env.NODE_ENV === 'production';

// Use different limits based on environment
const MAX_JOBS_PER_RUN = isProd ? 25 : Infinity;  // Fewer jobs for more time per job
const MAX_JOBS_PER_USER = isProd ? 3 : Infinity;  // Fewer jobs per user
const MAX_RUNTIME = isProd ? 50000 : 3600000;     // Under 1 minute in prod for safety
const JOB_TIMEOUT = isProd ? 45000 : 300000;      // 45 sec timeout (buffer for 60s limit)

// Track processed users for fair distribution
const processedUsers = new Set<string>();

export async function startWorker() {
  console.log('Starting sync worker...');
  const startTime = Date.now();
  let jobsProcessed = 0;

  // Process jobs until we hit limits
  while (jobsProcessed < MAX_JOBS_PER_RUN && (Date.now() - startTime) < MAX_RUNTIME) {
    try {
      const jobId = await getNextJob();
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

      // Set up job timeout
      const jobTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), JOB_TIMEOUT);
      });

      try {
        // Race between job processing and timeout
        await Promise.race([
          processJobWithStatus(jobId),
          jobTimeout
        ]);

        console.log('Job completed successfully:', jobId);
      } catch (error) {
        console.error('Error processing job:', jobId, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const status = await getJobStatus(jobId);
        
        if (error instanceof Error && error.message === 'Job timeout') {
          // If job timed out, requeue it to continue from last processed index
          await setJobStatus(jobId, {
            state: 'pending' as const,
            message: 'Job timed out - will continue in next run',
            lastProcessedIndex: status?.lastProcessedIndex || 0
          });
          await addJobToQueue(jobId);
        } else if (errorMessage.includes('Notion')) {
          await setJobStatus(jobId, {
            state: 'failed' as const,
            message: 'Failed to sync with Notion. Please ensure you have copied the Kindle Highlights template and granted necessary permissions.',
            lastProcessedIndex: status?.lastProcessedIndex || 0
          });
        } else {
          // For other errors, mark as failed but preserve progress
          await setJobStatus(jobId, {
            state: 'failed' as const,
            message: errorMessage,
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
    state: 'completed' as const,
    progress: 100,
    message: 'Successfully synced all highlights to Notion'
  };
  await setJobStatus(jobId, completedStatus);
}

// Start the worker
startWorker().catch(err => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});
