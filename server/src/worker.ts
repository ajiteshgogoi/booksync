import { getRedis, getNextJob, setJobStatus, getJobStatus, JobStatus } from './services/redisService';
import { processSyncJob } from './services/syncService';

// Configuration for worker behavior
const MAX_JOBS_PER_RUN = 100; // Process more jobs since we run once per day
const MAX_RUNTIME = 300000; // 5 minutes max runtime for Vercel
const JOB_TIMEOUT = 60000; // 60 seconds max per job

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

      console.log('Processing job:', jobId);
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
        
        const failedStatus: JobStatus = {
          state: 'failed' as const,
          message: error instanceof Error && error.message === 'Job timeout'
            ? 'Job timed out - will retry in next run'
            : errorMessage
        };

        await setJobStatus(jobId, failedStatus);

        if (errorMessage.includes('Notion')) {
          await setJobStatus(jobId, {
            state: 'failed' as const,
            message: 'Failed to sync with Notion. Please ensure you have copied the Kindle Highlights template and granted necessary permissions.'
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
