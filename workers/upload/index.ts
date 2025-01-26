import { parseClippings } from './utils/parseClippings.js';
import type { Highlight } from './types/highlight.js';
import { RedisClient } from './lib/redis-client';

// Stream configuration matching server
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

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    console.log('Upload worker received request');
    
    if (request.method !== 'POST') {
      console.error('Invalid method:', request.method);
      return new Response('Method not allowed', { status: 405 });
    }

    let redis: RedisClient | null = null;
    
    try {
      if (!env.REDIS_URL) {
        throw new Error("REDIS_URL environment variable is not set");
      }

      // Initialize Redis client
      redis = new RedisClient({ url: env.REDIS_URL });
      await redis.connect();  // Explicitly wait for connection
      
      const formData = await request.formData();
      console.log('Processing upload with params:', {
        fileKey: formData.get('fileKey'),
        userId: formData.get('userId'),
        hasDatabase: !!formData.get('databaseId')
      });

      const fileKey = formData.get('fileKey') as string;
      const userId = formData.get('userId') as string;
      const databaseId = formData.get('databaseId') as string;

      if (!fileKey || !userId || !databaseId) {
        return new Response('Missing required fields', { status: 400 });
      }

      // Process the file and create job
      const jobId = await processFile(redis, env.R2_BUCKET, fileKey, databaseId, userId);

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
      console.error('Processing error:', {
        error: error instanceof Error ? error.stack : error,
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      return new Response(
        JSON.stringify({
          error: 'Processing failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof Error ? error.stack : undefined
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    } finally {
      if (redis) {
        await redis.quit();
        console.log('Redis connection closed');
      }
    }
  }
};

async function processFile(
  redis: RedisClient,
  bucket: R2Bucket,
  fileKey: string,
  databaseId: string,
  userId: string
): Promise<string> {
  const jobId = `sync:${userId}:${Date.now()}`;

  try {
    // Set initial queued status
    await redis.set(`job:${jobId}`, JSON.stringify({
      state: 'queued',
      progress: 0,
      message: 'Starting file processing',
      lastProcessedIndex: 0,
      userId
    } as JobStatus));

    console.log(`[processFile] Starting R2 file fetch for key: ${fileKey}`);
    // Stream file from R2
    const file = await bucket.get(fileKey);
    if (!file) {
      throw new Error('File not found in R2');
    }
    console.log(`[processFile] File fetched from R2 successfully for key: ${fileKey}`);

    // Convert to text
    console.log('[processFile] Converting file to text');
    const fileContent = await file.text();
    console.log(`[processFile] File converted to text, length: ${fileContent.length}`);

    // Parse highlights
    console.log('[processFile] Parsing highlights');
    const highlights = await parseClippings(fileContent);
    console.log(`[processFile] Highlights parsed, count: ${highlights.length}`);

    // Store highlights in Redis with pipeline
    console.log('[processFile] Storing highlights in Redis pipeline');
    const pipeline = redis.pipeline();
    highlights.forEach((highlight, index) => {
      const key = `highlights:${jobId}:${index}`;
      pipeline.set(key, JSON.stringify({
        ...highlight,
        databaseId
      }), 'EX', 86400); // 24 hour TTL
    });
    console.log('[processFile] Executing Redis pipeline');
    await pipeline.exec();
    console.log('[processFile] Redis pipeline executed successfully');

    // Update status to parsed after storing highlights
    await redis.set(`job:${jobId}`, JSON.stringify({
      state: 'parsed',
      progress: 0,
      message: 'File parsed and ready for processing',
      total: highlights.length,
      lastProcessedIndex: 0,
      userId
    } as JobStatus));

    // Add to processing queue
    await redis.xadd(STREAM_NAME, '*', 'jobId', jobId, 'userId', userId, 'type', 'sync');
    console.log('[processFile] Job added to processing queue');

    return jobId;
  } catch (error) {
    console.error('Error processing file:', error);
    // Update status to failed
    await redis.set(`job:${jobId}`, JSON.stringify({
      state: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      userId
    } as JobStatus));
    throw error;
  }
}