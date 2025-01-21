import { redis, getNextJob, setJobStatus, JobStatus } from './services/redisService';
import { processSyncJob } from './services/syncService';

async function processJob(jobId: string) {
  try {
    // Update status to processing
    await setJobStatus(jobId, {
      state: 'processing',
      progress: 0,
      message: 'Starting sync...'
    });

    // Process job with progress updates
    await processSyncJob(jobId, async (progress: number, message: string) => {
      await setJobStatus(jobId, {
        state: 'processing',
        progress,
        message
      });
    });

    // Mark job as completed
    await setJobStatus(jobId, {
      state: 'completed',
      progress: 100,
      message: 'Sync completed successfully'
    });
  } catch (error) {
    console.error(`Failed processing job ${jobId}:`, error);
    await setJobStatus(jobId, {
      state: 'failed',
      message: error instanceof Error ? error.message : 'Sync failed'
    });
  }
}

async function processJobs() {
  while (true) {
    try {
      // Get next job from queue
      const jobId = await getNextJob();
      
      if (jobId) {
        console.log(`Processing job: ${jobId}`);
        await processJob(jobId);
        console.log(`Completed job: ${jobId}`);
      } else {
        // No jobs available, wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error('Job processing error:', error);
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start worker
processJobs().catch(error => {
  console.error('Worker failed:', error);
  process.exit(1);
});
