import { Router } from 'itty-router';
import type { Environment } from './types/env';
import type { Job } from './types/job';
import {
  parseClippings,
  NotionStore,
  NotionClient,
  createKVStore
} from '@booksync/shared';

// Constants
const BATCH_SIZE = 10; // Number of highlights to process per batch
const JOB_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize router
const router = Router();

// Response helpers
const errorResponse = (message: string, status = 500) => 
  new Response(JSON.stringify({ error: message }), { 
    status, 
    headers: { 'Content-Type': 'application/json' }
  });

const successResponse = (data: any) => 
  new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });

// DO request helper
async function callDurableObject(obj: DurableObjectStub, path: string, init?: RequestInit) {
  const url = new URL(path, 'https://dummy-base');
  const response = await obj.fetch(url.pathname + url.search, init);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DO request failed: ${text}`);
  }
  
  return response;
}

// Validate environment
function validateEnvironment(env: Environment): string[] {
  const errors: string[] = [];
  const required = [
    'NOTION_CLIENT_ID',
    'NOTION_CLIENT_SECRET',
    'NOTION_REDIRECT_URI'
  ];

  for (const key of required) {
    if (!env[key as keyof Environment]) {
      errors.push(`Missing ${key}`);
    }
  }

  return errors;
}

// Health check endpoint with environment validation
router.get('/health', (_, env: Environment) => {
  const envErrors = validateEnvironment(env);
  const r2Status = env.HIGHLIGHTS_BUCKET ? 'connected' : 'error';
  const kvStatus = env.OAUTH_STORE ? 'connected' : 'error';

  return successResponse({
    status: 'ok',
    time: new Date().toISOString(),
    services: {
      r2: r2Status,
      kv: kvStatus,
      doStatus: 'connected'
    },
    envStatus: envErrors.length === 0 ? 'valid' : 'invalid',
    envErrors
  });
});

// Test webhook endpoint
router.post('/test-webhook', async (request) => {
  try {
    const data = await request.json();
    return successResponse({
      received: true,
      timestamp: new Date().toISOString(),
      payload: data
    });
  } catch (error) {
    return errorResponse('Invalid JSON payload');
  }
});

// Upload endpoint with improved error handling and logging
router.post('/upload', async (request, env: Environment) => {
  console.log('Processing upload request...');
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const workspaceId = formData.get('workspaceId') as string;

    console.log('Received upload request:', {
      fileName: file?.name,
      userId,
      workspaceId
    });

    if (!file || !userId || !workspaceId) {
      return errorResponse('Missing required fields: file, userId, or workspaceId', 400);
    }

    // Validate file type
    if (!file.name.endsWith('.txt')) {
      return errorResponse('Invalid file type. Only .txt files are allowed.', 400);
    }

    // Generate unique file key
    const fileKey = `uploads/${userId}/${crypto.randomUUID()}.txt`;
    
    console.log('Storing file in R2:', fileKey);
    
    // Store file in R2 with custom headers
    await env.HIGHLIGHTS_BUCKET.put(fileKey, file.stream(), {
      customMetadata: {
        userId,
        workspaceId,
        originalName: file.name,
        uploadTime: new Date().toISOString()
      }
    });

    console.log('File stored successfully, creating job...');

    // Create sync job
    const jobStore = env.JOB_STORE.get(env.JOB_STORE.idFromName(userId));
    const jobResponse = await callDurableObject(jobStore, '/create', {
      method: 'POST',
      body: JSON.stringify({ 
        userId, 
        fileKey,
        workspaceId,
        expiresAt: Date.now() + JOB_EXPIRY
      })
    });

    const job = await jobResponse.json<Job>();
    console.log('Job created successfully:', job.id);
    
    return successResponse(job);
  } catch (error) {
    console.error('Upload error:', error);
    return errorResponse('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
});

// Sync endpoint with detailed progress reporting
router.post('/sync', async (request, env: Environment) => {
  console.log('Processing sync request...');
  try {
    const { jobId, userId } = await request.json() as { jobId: string, userId: string };
    if (!jobId || !userId) {
      return errorResponse('Missing jobId or userId', 400);
    }

    console.log('Processing sync for job:', jobId, 'user:', userId);

    // Initialize stores and clients
    const jobStore = env.JOB_STORE.get(env.JOB_STORE.idFromName(userId));
    const kvStore = createKVStore(env.OAUTH_STORE);
    const notionStore = new NotionStore(kvStore);

    // Get job status
    console.log('Fetching job status...');
    const jobResponse = await callDurableObject(jobStore, `/status?id=${jobId}`);
    const job = await jobResponse.json<Job>();
    if (!job) {
      return errorResponse('Job not found', 404);
    }
    
    if (!job.fileKey || !job.workspaceId) {
      return errorResponse('Invalid job state', 400);
    }

    console.log('Job details:', {
      id: job.id,
      status: job.status,
      progress: job.progress
    });

    // Check if job has expired
    if (job.expiresAt && job.expiresAt < Date.now()) {
      console.log('Job expired:', job.id);
      await callDurableObject(jobStore, '/update', {
        method: 'POST',
        body: JSON.stringify({ id: jobId, status: 'expired' })
      });
      return errorResponse('Job has expired', 400);
    }

    try {
      // Update job status to processing
      console.log('Updating job status to processing...');
      await callDurableObject(jobStore, '/update', {
        method: 'POST',
        body: JSON.stringify({ id: jobId, status: 'processing' })
      });

      // Get file from R2
      console.log('Fetching file from R2:', job.fileKey);
      const file = await env.HIGHLIGHTS_BUCKET.get(job.fileKey);
      if (!file) {
        throw new Error('File not found in R2');
      }

      // Parse highlights
      console.log('Parsing highlights...');
      const text = await file.text();
      const highlights = await parseClippings(text);

      console.log(`Found ${highlights.length} highlights`);

      if (highlights.length === 0) {
        throw new Error('No highlights found in file');
      }

      // Initialize Notion client
      console.log('Initializing Notion client...');
      const notionClient = new NotionClient({
        store: notionStore,
        clientId: env.NOTION_CLIENT_ID,
        clientSecret: env.NOTION_CLIENT_SECRET
      });

      // Process highlights in batches
      console.log('Processing highlights in batches...');
      for (let i = 0; i < highlights.length; i += BATCH_SIZE) {
        const batch = highlights.slice(i, Math.min(i + BATCH_SIZE, highlights.length));
        
        console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(highlights.length / BATCH_SIZE)}`);
        await notionClient.updateNotionDatabase(batch, job.workspaceId);

        // Update progress
        const progress = Math.floor((i + BATCH_SIZE) / highlights.length * 100);
        await callDurableObject(jobStore, '/update', {
          method: 'POST',
          body: JSON.stringify({ id: jobId, progress: Math.min(progress, 100) })
        });

        // Allow other requests to be processed
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mark job as completed
      console.log('Marking job as completed...');
      await callDurableObject(jobStore, '/update', {
        method: 'POST',
        body: JSON.stringify({ 
          id: jobId, 
          status: 'completed',
          completedAt: new Date().toISOString()
        })
      });

      return successResponse({ 
        status: 'success',
        jobId,
        totalHighlights: highlights.length
      });
    } catch (error) {
      console.error('Sync error:', error);
      
      // Update job with error
      await callDurableObject(jobStore, '/update', {
        method: 'POST',
        body: JSON.stringify({ 
          id: jobId, 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      });

      return errorResponse('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  } catch (error) {
    console.error('Request error:', error);
    return errorResponse('Invalid request');
  }
});

// Error handling middleware
const errorHandler = async (error: Error) => {
  console.error('Unhandled error:', error);
  return errorResponse('Internal server error');
};

// Scheduled task handler
async function handleScheduled(env: Environment, ctx: ExecutionContext, type: string) {
  console.log(`Running scheduled ${type}...`);
  
  const jobStore = env.JOB_STORE.get(env.JOB_STORE.idFromName('scheduled-jobs'));

  if (type === 'sync') {
    // Get all pending jobs from Durable Object
    console.log('Fetching pending jobs...');
    const jobResponse = await callDurableObject(jobStore, '/list?status=pending');
    const jobs = await jobResponse.json<Job[]>();
    console.log(`Found ${jobs.length} pending jobs`);

    // Process each pending job
    for (const job of jobs) {
      console.log(`Scheduling job ${job.id} for processing...`);
      ctx.waitUntil(
        fetch(`https://${env.WORKER_HOST}/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            userId: job.userId
          })
        })
      );
    }
  } else if (type === 'cleanup') {
    console.log('Running job cleanup...');
    const response = await callDurableObject(jobStore, '/cleanup', {
      method: 'POST'
    });
    const result = await response.json();
    console.log('Cleanup complete:', result);
  }
}

export default {
  async fetch(
    request: Request,
    env: Environment,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      return await router.handle(request, env, ctx);
    } catch (error) {
      return errorHandler(error as Error);
    }
  },

  // Handle scheduled events
  async scheduled(
    controller: ScheduledController,
    env: Environment,
    ctx: ExecutionContext
  ): Promise<void> {
    // Determine the type of scheduled task based on the cron pattern
    const cronPattern = controller.cron;
    const taskType = cronPattern === '0 0 * * *' ? 'cleanup' : 'sync';
    await handleScheduled(env, ctx, taskType);
  }
};

