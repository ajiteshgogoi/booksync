import { Redis } from 'ioredis';
import { workerService } from '../../server/src/services/workerService.js';
import { RedisPool } from '../../server/src/services/redisService.js';

interface Env {
  REDIS_URL: string;
  WORKER_API_KEY: string;
  NODE_ENV: string;
  R2_BUCKET: R2Bucket;
}

function validateApiKey(apiKey: string, env: Env): boolean {
  return apiKey === env.WORKER_API_KEY;
}

class SyncWorker {
  private workerStarted = false;

  constructor(private env: Env) {}

  async processPendingJobs(redis: Redis): Promise<void> {
    if (this.workerStarted) return;
    this.workerStarted = true;

    try {
      // Initialize Redis connection in worker service
      await workerService.initRedis(redis);
      // Initialize connection reaper within handler scope
      RedisPool.getInstance().startConnectionReaper();
      
      // Start the worker service
      await workerService.start();
    } catch (error) {
      console.error('Error starting worker service:', error);
      throw error;
    } finally {
      this.workerStarted = false;
      RedisPool.getInstance().stopConnectionReaper();
      redis.quit();
    }
  }
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Get API key from environment variables
    const apiKey = env.WORKER_API_KEY;

    if (!apiKey || !validateApiKey(apiKey, env)) {
      throw new Error('Invalid or missing API key');
    }

    const redis = new Redis(env.REDIS_URL);
    const worker = new SyncWorker(env);
    await worker.processPendingJobs(redis);
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle direct HTTP requests for debugging
    const redis = new Redis(env.REDIS_URL);
    const worker = new SyncWorker(env);
    try {
      await worker.processPendingJobs(redis);
      return new Response('Worker started successfully', { status: 200 });
    } catch (error) {
      return new Response(`Error starting worker: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        status: 500
      });
    }
  }
};
