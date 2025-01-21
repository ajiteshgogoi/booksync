import { Worker, Job } from 'bullmq';
import { getRedis } from './services/redisService';
import { processSyncJob } from './services/syncService';
import type { Redis as UpstashRedis } from '@upstash/redis';

export async function createWorker() {
  const redis = await getRedis();
  
  return new Worker(
    'sync_jobs',
    async (job: Job) => {
      try {
        await processSyncJob(job.data.jobId, async (progress, message) => {
          await job.updateProgress(progress);
          await job.log(message);
        });
      } catch (error) {
        console.error('Error processing sync job:', error);
        throw error;
      }
    },
    {
      connection: {
        host: process.env.UPSTASH_REDIS_REST_URL,
        password: process.env.UPSTASH_REDIS_REST_TOKEN,
        tls: {}
      }
    }
  );
}

let worker: Worker | null = null;

createWorker().then(w => {
  worker = w;
  
  worker.on('completed', (job: Job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`Job ${job?.id} failed with error:`, err);
  });

  process.on('SIGTERM', async () => {
    if (worker) {
      await worker.close();
    }
  });
}).catch(err => {
  console.error('Failed to create worker:', err);
  process.exit(1);
});
