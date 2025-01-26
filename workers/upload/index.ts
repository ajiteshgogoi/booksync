import { parseClippings } from '../../server/src/utils/parseClippings.js';
import type { Highlight } from '../../server/src/types/highlight.js';
import { RedisClient } from './lib/redis-client';

// Stream configuration matching server
// Stream name matching sync worker
const STREAM_NAME = 'kindle:jobs';

interface Env {
  R2_BUCKET: R2Bucket;
  REDIS_URL: string;
  WORKER_API_KEY: string;
}

interface JobStatus {
  state: 'queued' | 'pending' | 'processing' | 'completed' | 'failed' | 'parsed';
  progress?: number;
  message?: string;
  total?: number;
  lastProcessedIndex?: number;
  userId?: string;
}

class UploadWorker {
  private redis: RedisClient;

  constructor(
    private env: Env,
    private ctx: ExecutionContext
  ) {
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL environment variable is not set");
    }
    this.redis = new RedisClient({ url: env.REDIS_URL });
  }

  private async processFile(
    fileName: string,
    databaseId: string,
    userId: string
  ): Promise<string> {
    const jobId = `sync:${userId}:${Date.now()}`;

    try {
      // Set initial queued status
      await this.redis.set(`job:${jobId}`, JSON.stringify({
        state: 'queued',
        progress: 0,
        message: 'Starting file processing',
        lastProcessedIndex: 0,
        userId
      } as JobStatus));

      // Stream file from R2
      const file = await this.env.R2_BUCKET.get(fileName);
      if (!file) {
        throw new Error('File not found in R2');
      }

      // Convert to text
      const fileContent = await file.text();

      // Parse highlights
      const highlights = await parseClippings(fileContent);

      // Store highlights in Redis with pipeline
      const pipeline = this.redis.pipeline();
      highlights.forEach((highlight, index) => {
        const key = `highlights:${jobId}:${index}`;
        pipeline.set(key, JSON.stringify({
          ...highlight,
          databaseId
        }), 'EX', 3600); // 1 hour TTL
      });

      await pipeline.exec();

      // Update status to parsed after storing highlights
      await this.redis.set(`job:${jobId}`, JSON.stringify({
        state: 'parsed',
        progress: 0,
        message: 'File parsed and ready for processing',
        total: highlights.length,
        lastProcessedIndex: 0,
        userId
      } as JobStatus));

      // Add to processing queue
      await this.redis.xadd(STREAM_NAME, '*', 'jobId', jobId, 'userId', userId, 'type', 'sync');

      return jobId;
    } catch (error) {
      console.error('Error processing file:', error);
      // Update status to failed
      await this.redis.set(`job:${jobId}`, JSON.stringify({
        state: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        userId
      } as JobStatus));
      throw error;
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      const fileName = formData.get('fileName') as string;
      const userId = formData.get('userId') as string;
      const databaseId = formData.get('databaseId') as string;

      if (!fileName || !userId || !databaseId) {
        return new Response('Missing required fields', { status: 400 });
      }

      // Process the file and create job
      const jobId = await this.processFile(fileName, databaseId, userId);

      return new Response(
        JSON.stringify({
          jobId,
          message: 'File processed and queued for sync'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );

    } catch (error) {
      console.error('Processing error:', error);
      return new Response(
        JSON.stringify({
          error: 'Processing failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const worker = new UploadWorker(env, ctx);
    return worker.fetch(request);
  }
};