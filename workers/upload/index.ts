import { Redis } from '@upstash/redis';
import { parseClippings } from '../../server/src/utils/parseClippings.js';
import type { Highlight } from '../../server/src/types/highlight.js';

interface Env {
  R2_BUCKET: R2Bucket;
  REDIS_URL: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
}

interface JobStatus {
  state: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  total?: number;
  lastProcessedIndex?: number;
  userId?: string;
}

class UploadWorker {
  private redis: Redis;

  constructor(
    private env: Env,
    private ctx: ExecutionContext
  ) {
    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  private async queueJob(
    databaseId: string, 
    fileContent: string, 
    userId: string
  ): Promise<string> {
    const jobId = `sync:${userId}:${Date.now()}`;

    try {
      // Parse highlights
      const highlights = await parseClippings(fileContent);

      // Store job metadata
      await this.redis.set(`job:${jobId}`, JSON.stringify({
        state: 'pending',
        progress: 0,
        message: 'Job queued',
        total: highlights.length,
        lastProcessedIndex: 0,
        userId
      } as JobStatus));

      // Store highlights in Redis
      const pipeline = this.redis.pipeline();
      for (const [index, highlight] of highlights.entries()) {
        const key = `highlights:${jobId}:${index}`;
        pipeline.set(key, JSON.stringify({
          ...highlight,
          databaseId
        }), { ex: 3600 }); // 1 hour TTL
      }

      await pipeline.exec();

      // Add to processing queue
      await this.redis.xadd('kindle:jobs', '*', {
        jobId,
        userId,
        type: 'sync'
      });

      return jobId;
    } catch (error) {
      // Cleanup on error
      await this.redis.del(`job:${jobId}`);
      throw error;
    }
  }

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const userId = formData.get('userId') as string;
      const databaseId = formData.get('databaseId') as string;

      if (!file || !userId || !databaseId) {
        return new Response('Missing required fields', { status: 400 });
      }

      // Store file in R2
      const fileName = `${userId}/${Date.now()}-${file.name}`;
      await this.env.R2_BUCKET.put(fileName, file);

      // Process file content and queue job
      const fileContent = await file.text();
      const jobId = await this.queueJob(databaseId, fileContent, userId);

      return new Response(
        JSON.stringify({ 
          jobId,
          message: 'File uploaded and queued for processing'
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
      console.error('Upload error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Upload failed',
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