import { Redis } from 'ioredis';
import { workerService } from '../../server/src/services/workerService.js';

interface Env {
  REDIS_URL: string;
  WORKER_API_KEY: string;
  NODE_ENV: string;
}

function validateApiKey(apiKey: string, env: Env): boolean {
  return apiKey === env.WORKER_API_KEY;
}

class SyncWorker {
  private workerStarted = false;
  private redis: Redis;

  constructor(private env: Env) {
    // Initialize Redis connection
    this.redis = new Redis(env.REDIS_URL);
  }

  async processPendingJobs(): Promise<void> {
    if (this.workerStarted) return;
    this.workerStarted = true;

    try {
      // Initialize Redis connection in worker service
      await workerService.initRedis(this.redis);
      
      // Start the worker service
      await workerService.start();
    } catch (error) {
      console.error('Error starting worker service:', error);
      throw error;
    } finally {
      this.workerStarted = false;
      this.redis.quit();
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

    const worker = new SyncWorker(env);
    await worker.processPendingJobs();
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Handle direct HTTP requests for debugging
    const worker = new SyncWorker(env);
    try {
      await worker.processPendingJobs();
      return new Response('Worker started successfully', { status: 200 });
    } catch (error) {
      return new Response(`Error starting worker: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        status: 500
      });
    }
  }
};
