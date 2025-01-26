import { Router, IRequest } from 'itty-router';
import type { Environment } from './types/env';
import type { Job } from './types/job';
import {
  NotionStore,
  NotionClient,
  createKVStore,
  SyncService,
  parseClippings
} from '@booksync/shared';
import { KVJobStore } from './services/kvJobStore';
import { OAuthCallbackService } from './services/oauthCallbackService';

// Constants
const BATCH_SIZE = 10; // Number of highlights to process per batch
const JOB_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Initialize router
const router = Router();

// Middleware for API key validation
const validateApiKey = (request: Request | IRequest, env: Environment) => {
  const apiKey = request instanceof Request ?
    request.headers.get('x-api-key') :
    request.headers['x-api-key'];
    
  if (!apiKey || apiKey !== env.WORKER_API_KEY) {
    return errorResponse('Invalid or missing API key', 401);
  }
};

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
// Validate environment
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
  
  // Validate API key
  const authError = validateApiKey(request, env);
  if (authError) return authError;

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

    // Create sync job using KVJobStore
    const jobStore = new KVJobStore(env.JOB_STORE);
    const job = await jobStore.createJob({
      userId,
      fileKey,
      workspaceId,
      expiresAt: Date.now() + JOB_EXPIRY
    });

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
    const jobStore = new KVJobStore(env.JOB_STORE);
    const kvStore = createKVStore(env.OAUTH_STORE);
    const notionStore = new NotionStore(kvStore);

    // Get job status
    console.log('Fetching job status...');
    const job = await jobStore.getJob(jobId);
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

    // Validate API key for sync endpoint
    const authError = validateApiKey(request, env);
    if (authError) return authError;

    // Check if job has expired
    if (job.expiresAt && job.expiresAt < Date.now()) {
      console.log('Job expired:', job.id);
      await jobStore.updateJob(jobId, { status: 'expired' });
      return errorResponse('Job has expired', 400);
    }

    try {
      // Update job status to processing
      console.log('Updating job status to processing...');
      await jobStore.updateJob(jobId, { status: 'processing' });

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

      // Initialize services
      console.log('Initializing services...');
      const notionClient = new NotionClient({
        store: notionStore,
        clientId: env.NOTION_CLIENT_ID,
        clientSecret: env.NOTION_CLIENT_SECRET,
        redirectUri: env.NOTION_REDIRECT_URI
      });

      const syncService = new SyncService(notionClient, {
        batchSize: BATCH_SIZE,
        batchDelay: 100,
        onProgress: async (progress, message) => {
          console.log(message);
          await jobStore.updateJob(jobId, { progress: Math.min(progress, 100) });
        }
      });

      // Process highlights
      console.log('Processing highlights...');
      await syncService.syncHighlights(text, job.workspaceId);

      // Mark job as completed
      console.log('Marking job as completed...');
      await jobStore.updateJob(jobId, {
        status: 'completed',
        completedAt: new Date().toISOString()
      });

      return successResponse({ 
        status: 'success',
        jobId,
        totalHighlights: highlights.length
      });
    } catch (error) {
      console.error('Sync error:', error);
      
      // Update job with error
      await jobStore.updateJob(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return errorResponse('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  } catch (error) {
    console.error('Request error:', error);
    return errorResponse('Invalid request');
  }
});

// OAuth callback endpoint
router.get('/oauth/callback', async (request: IRequest, env: Environment) => {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth error response
    if (error) {
      console.error('OAuth error:', { error, errorDescription });
      // Redirect to client with error
      const clientUrl = new URL(env.CLIENT_URL || 'http://localhost:5173');
      clientUrl.searchParams.set('error', error);
      if (errorDescription) {
        clientUrl.searchParams.set('errorDescription', errorDescription);
      }
      return new Response(null, {
        status: 302,
        headers: {
          'Location': clientUrl.toString()
        }
      });
    }

    if (!code || !state) {
      return errorResponse('Missing code or state parameter', 400);
    }

    const oauthService = new OAuthCallbackService(env);
    const { redirectUrl } = await oauthService.handleCallback(code);
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl
      }
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    // On error, redirect to client with error message
    const clientUrl = new URL(env.CLIENT_URL || 'http://localhost:5173');
    clientUrl.searchParams.set('error', 'oauth_error');
    clientUrl.searchParams.set('errorDescription', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': clientUrl.toString()
      }
    });
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

  const jobStore = new KVJobStore(env.JOB_STORE);

  if (type === 'sync') {
    // Get all pending jobs
    console.log('Fetching pending jobs...');
    const jobs = await jobStore.listJobs('', 'pending');
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
    const cleanedCount = await jobStore.cleanupJobs();
    console.log('Cleanup complete:', { cleaned: cleanedCount });
  }
}

export default {
  async fetch(
    request: Request,
    env: Environment,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      // Create URL object for request
      const url = new URL(request.url);
      
      // Create a new request object with the required properties
      const routerRequest: IRequest = {
        method: request.method,
        url: url.toString(),
        headers: request.headers,
        params: {},
        query: Object.fromEntries(url.searchParams)
      };
      
      return await router.handle(routerRequest, env, ctx);
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

export { JobStore } from './services/jobStore';
