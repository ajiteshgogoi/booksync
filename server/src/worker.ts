import { processSyncJob } from './services/syncService';
import { redis } from './services/redisService';
import { JOB_TTL } from './services/redisService';

async function processJobs() {
  while (true) {
    try {
      // Get next job from queue
      const jobId = await redis.lpop('sync-queue');
      
      if (typeof jobId === 'string') {
        console.log(`Processing job: ${jobId}`);
        await processSyncJob(jobId);
      } else {
        // No jobs available, wait before checking again
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Completed job: ${jobId}`);
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
