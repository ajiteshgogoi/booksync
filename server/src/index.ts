import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import type { Express } from 'express-serve-static-core';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Configure dotenv
function loadEnv() {
  // When running with ts-node (development)
  if (process.env.NODE_ENV !== 'production') {
    config(); // First try default loading (process.cwd())
    
    // If that didn't work, try explicit paths
    if (!process.env.NOTION_OAUTH_CLIENT_ID) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const serverRoot = join(__dirname, process.env.NODE_ENV === 'development' ? '../..' : '../../../..');
      
      console.log('Loading .env from server root:', serverRoot);
      const envPath = join(serverRoot, '.env');
      const result = config({ path: envPath });
      
      if (!result.parsed) {
        throw new Error(`Failed to load .env file from ${envPath}`);
      }
      
      console.log('Environment loaded from:', envPath);
    }
  }
  
  // Validate required environment variables
  const required = [
      'NOTION_OAUTH_CLIENT_ID',
      'NOTION_OAUTH_CLIENT_SECRET',
      'R2_ENDPOINT',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('Environment configuration:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    NOTION_CONFIG: {
      clientId: process.env.NOTION_OAUTH_CLIENT_ID ? 'configured' : 'missing',
      redirectUri: process.env.NOTION_REDIRECT_URI || 'http://localhost:3001/auth/notion/callback'
    }
  });
}

// Initialize environment
loadEnv();

interface User {
  id: string;
}

interface CustomRequest extends Request {
  user?: User;
  file?: Express.Multer.File;
}

declare global {
  namespace Express {
    interface Multer {
      File: {
        buffer: Buffer;
        mimetype: string;
        size: number;
      }
    }
  }
}
import axios from 'axios';
import multer from 'multer';
import { startWorker } from './worker.js';
import { processSyncJob, getSyncStatus } from './services/syncService.js';
import type { JobStatus } from './types/job.js';
import { jobStateService } from './services/jobStateService.js';
import { queueService } from './services/queueService.js';
import { triggerProcessing } from './services/githubService.js';
import { streamFile } from './services/r2Service.js';
import { parseClippings } from './utils/parseClippings.js';
import { setOAuthToken, getClient, refreshToken, clearAuth } from './services/notionClient.js';
import { rateLimiter } from './services/rateLimiter.js';
import qs from 'querystring';
import cookieParser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

// Use API base path for Vercel deployment
const apiBasePath = process.env.NODE_ENV === 'production' ? '/api' : '';

// Import handlers and services
import { uploadUrlHandler } from './api/upload-url.js';
import { validateSync, ValidationError } from './services/syncValidationService.js';

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://booksync.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Upload URL endpoint
app.post('/api/upload-url', uploadUrlHandler);

// R2 parse endpoint
app.post('/api/parse-r2', async (req: Request, res: Response) => {
  console.log('Parse R2 request received:', {
    method: req.method,
    url: req.url,
    headers: req.headers
  });

  try {
    const { fileKey } = req.body;

    if (!fileKey) {
      console.error('Missing required parameter: fileKey');
      return res.status(400).json({ error: 'FileKey is required' });
    }

    console.log('Streaming file from R2:', fileKey);
    const fileStream = await streamFile(fileKey);
    console.log('File stream obtained');

    // Convert stream to buffer to parse content
    const chunks: Buffer[] = [];
    await new Promise((resolve, reject) => {
      fileStream.on('data', (chunk: Buffer | string) => chunks.push(Buffer.from(chunk)));
      fileStream.on('error', reject);
      fileStream.on('end', resolve);
    });

    const fileContent = Buffer.concat(chunks).toString('utf-8');
    console.log('File content length:', fileContent.length);

    const highlights = await parseClippings(fileContent);
    console.log('Parsed highlights count:', highlights.length);
    
    res.json({ count: highlights.length });
  } catch (error) {
    console.error('Error parsing file from R2:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to parse file',
      timestamp: new Date().toISOString()
    });
  }
});

// Generate random state for OAuth
function generateState() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Sync validation endpoint
app.post(`${apiBasePath}/validate-sync`, async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    await validateSync(userId);
    res.json({
      valid: true
    });
  } catch (error) {
    res.json({
      valid: false,
      error: error instanceof ValidationError ? error.message : 'Validation failed'
    });
  }
});

// Health check endpoint
app.get(`${apiBasePath}/health`, (req: Request, res: Response) => {
  const config = {
    status: 'ok',
    environment: process.env.NODE_ENV,
    notionConfig: {
      clientId: process.env.NOTION_OAUTH_CLIENT_ID ? 'configured' : 'missing',
      redirectUri: process.env.NOTION_REDIRECT_URI || 'using default',
      clientSecret: process.env.NOTION_OAUTH_CLIENT_SECRET ? 'configured' : 'missing'
    }
  };
  
  console.log('Health check response:', config);
  res.status(200).json(config);
});

// Test GitHub connection
app.get(`${apiBasePath}/test-github`, async (req: Request, res: Response) => {
  try {
    const token = process.env.GITHUB_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'GitHub token not configured' });
    }

    console.log('\nTesting GitHub API connection...');

    // Test repository access
    const repoResponse = await axios.get(
      'https://api.github.com/repos/ajiteshgogoi/booksync',
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`, // PATs always use token prefix
          'User-Agent': 'BookSync-App'
        }
      }
    );

    console.log('Repository access successful');

    // Test workflow dispatch
    console.log('\nTesting workflow dispatch...');
    const dispatchResponse = await axios.post(
      'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
      {
        event_type: 'process_highlights_test',
        client_payload: {
          test: true,
          timestamp: new Date().toISOString()
        }
      },
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `token ${token}`, // PATs always use token prefix
          'User-Agent': 'BookSync-App'
        }
      }
    );

    console.log('Workflow dispatch response:', dispatchResponse.status);

    res.json({
      success: true,
      repoAccess: true,
      repoName: repoResponse.data.full_name,
      dispatchPermission: true,
      testWorkflowTriggered: dispatchResponse.status === 204,
      tokenInfo: {
        present: true,
        length: token.length,
        format: token.startsWith('github_pat_') ? 'Fine-grained PAT' :
                token.startsWith('ghp_') ? 'Fine-grained token' :
                token.length === 40 ? 'Classic token' :
                'Unknown format'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
  }
});

// Parse endpoint to get highlight count
app.post(`${apiBasePath}/parse`, upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log('Received parse request');
    
    // Get client IP address (handle both string and string[] cases)
    const xForwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : (xForwardedFor || req.socket.remoteAddress);
    
    if (!clientIp || typeof clientIp !== 'string') {
      return res.status(400).json({ error: 'Could not determine client IP' });
    }

    // Check rate limit (but don't increment for parse)
    const rateLimit = rateLimiter.check(clientIp);
    if (!rateLimit.allowed) {
      const remainingMinutes = Math.ceil(rateLimit.remainingTime / 60);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You have exceeded the upload limit of 2 uploads per hour. Please try again in ${remainingMinutes} minutes.`
      });
    }

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File size:', req.file.size, 'bytes');
    const fileContent = req.file.buffer.toString('utf-8');
    console.log('File content preview:', fileContent.slice(0, 200));

    const highlights = await parseClippings(fileContent);
    console.log('Parsed highlights count:', highlights.length);
    const response = { count: highlights.length };
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: 'Failed to parse highlights' });
  }
});

// Auth check endpoint
app.get(`${apiBasePath}/auth/check`, async (req: Request, res: Response) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({ authenticated: false });
    }

    const { upstashService } = await import('./services/upstashService.js');
    const userState = await upstashService.getUserState(userId);

    if (userState && userState.oauthToken) {
      // Also verify Notion client still works
      const client = await getClient();
      if (client) {
        return res.status(200).json({ authenticated: true });
      }
    }

    res.status(401).json({ authenticated: false });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
});

// Notion OAuth routes
app.get(`${apiBasePath}/auth/notion`, (req: Request, res: Response) => {
  try {
    console.log('\n=== Starting Notion OAuth Flow ===');
    
    // Generate and validate state
    const state = generateState();
    console.log('Generated state:', state);
    
    // Get and validate configuration
    const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    const finalRedirectUri = redirectUri || `http://localhost:3001${apiBasePath}/auth/notion/callback`;

    // Validate client ID
    if (!clientId || clientId === 'undefined' || clientId === 'null') {
      console.error('Invalid NOTION_OAUTH_CLIENT_ID:', clientId);
      return res.status(500).json({
        error: 'OAuth configuration error',
        details: 'Client ID is not properly configured'
      });
    }

    // Log configuration
    console.log('OAuth Configuration:', {
      clientId,
      redirectUri: finalRedirectUri,
      state
    });

    // Construct auth URL
    const authUrl = `https://api.notion.com/v1/oauth/authorize?${
      qs.stringify({
        client_id: clientId,
        redirect_uri: finalRedirectUri,
        response_type: 'code',
        state: state,
      })
    }`;
    
    // Set cookie and redirect
    res.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('Redirecting to Notion OAuth URL');
    res.redirect(authUrl);
  } catch (error) {
    console.error('Failed to initiate OAuth flow:', error);
    res.status(500).json({
      error: 'OAuth initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get(`${apiBasePath}/auth/notion/callback`, async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const storedState = req.cookies.oauth_state;

  if (!code || !state || state !== storedState) {
    return res.redirect(`${process.env.CLIENT_URL}?error=Invalid OAuth state`);
  }

  try {
    const finalRedirectUri = process.env.NOTION_REDIRECT_URI || `http://localhost:3001${apiBasePath}/auth/notion/callback`;
    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: finalRedirectUri,
    }, {
      auth: {
        username: process.env.NOTION_OAUTH_CLIENT_ID!,
        password: process.env.NOTION_OAUTH_CLIENT_SECRET!,
      }
    });
const userId = response.data.owner?.user?.id;
const workspaceId = response.data.workspace_id;
const oauthToken = response.data.access_token;

// Store OAuth data in Upstash
await setOAuthToken(response.data);

// Store user state in Upstash
const { upstashService } = await import('./services/upstashService.js');
await upstashService.saveUserState(userId, {
  oauthToken,
  userId,
  workspaceId,
  databaseId: '' // Will be set later when user selects database
});

// Set userId cookie and include it in redirect URL
res.cookie('userId', userId, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});

// Include userId in redirect URL
res.redirect(`${process.env.CLIENT_URL}?auth=success&userId=${userId}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}?error=Failed to complete OAuth flow`);
  }
});

app.post(`${apiBasePath}/auth/refresh`, async (req: Request, res: Response) => {
  try {
    await refreshToken();
    res.status(200).json({ status: 'Token refreshed' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Job status endpoint
app.get(`${apiBasePath}/sync/status/:jobId`, async (req: Request, res: Response) => {
  try {
    const jobId = req.params.jobId;
    const status = await getSyncStatus(jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check job status' });
  }
});

app.post(`${apiBasePath}/auth/disconnect`, async (req: Request, res: Response) => {
  try {
    const userId = req.cookies.userId;
    if (userId) {
      // Clear user state from Upstash
      const { upstashService } = await import('./services/upstashService.js');
      await upstashService.deleteUserState(userId);
    }
    
    // Clear Notion auth
    await clearAuth();
    
    // Clear cookie
    res.clearCookie('userId');
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Sync endpoint for uploading MyClippings.txt with timeout
app.post(`${apiBasePath}/sync`, upload.single('file'), async (req: CustomRequest, res: Response) => {
  const timeout = 30000; // 30 second timeout
  const timeoutHandle = setTimeout(() => {
    if (!res.headersSent) {
      res.status(504).json({
        error: 'Request timeout',
        message: 'The request took too long to process. Please try again.'
      });
    }
  }, timeout);

  try {
    console.log('\n=== Sync Request Received ===');
    
    // Get client IP for rate limiting
    const xForwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(xForwardedFor)
      ? xForwardedFor[0]
      : (xForwardedFor || req.socket.remoteAddress);
    
    if (!clientIp || typeof clientIp !== 'string') {
      return res.status(400).json({ error: 'Could not determine client IP' });
    }

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');

    // Get user ID from the client request
    const userId = req.cookies.userId;
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please reconnect to Notion'
      });
    }

    // Increment rate limit counter after validation passes
    rateLimiter.increment(clientIp);
    console.log('Processing for user:', userId);
    
    // Start by creating a job ID
    const jobId = `sync:${userId}:${Date.now()}`;
    console.log('Created job ID:', jobId);
    
    // Create initial job and set state
    await jobStateService.createJob({
      jobId,
      fileName: 'MyClippings.txt',
      userId,
      databaseId: ''  // Will be set later in the process
    });

    // Update with initial progress
    await jobStateService.updateJobState(jobId, {
      progress: 0,
      message: 'Uploading highlights for processing',
      total: 0
    });
    console.log('Initial job state created');

    console.log('\n=== Upload Processing Start ===');
    console.log('File content length:', fileContent.length);
    console.log('Preview:', fileContent.slice(0, 200));
    
    try {

      console.log('=== Starting File Processing ===');
      console.log('Trigger Details:', {
        fileContentLength: fileContent.length,
        userId,
        jobId,
        githubTokenPresent: !!process.env.GITHUB_ACCESS_TOKEN,
        clientIp
      });
      
      console.log('Starting job processing...');
      try {
        // Add job to queue
        await queueService.addToQueue(jobId, userId);
        console.log('Job added to queue');

        // Trigger GitHub processing
        const result = await triggerProcessing(fileContent, userId, clientIp);
        console.log('\n✅ Successfully triggered GitHub processing:', {
          jobId,
          fileName: result,
          userId,
          fileSize: fileContent.length
        });
        
        // Update job state after successful trigger
        await jobStateService.updateJobState(jobId, {
          state: 'queued',
          message: 'File uploaded and queued for processing',
          progress: 0,
          result: { fileName: result }
        });
  
        // Send response only after successful processing
        res.json({
          success: true,
          jobId,
          message: 'Upload received and processing started.',
          info: 'Your highlights will be processed in GitHub Actions. You can safely close this page - progress is automatically saved.'
        });
      } catch (error) {
        console.error('Failed to trigger GitHub processing:', error);
        const errorMessage = error instanceof Error ?
          error.message :
          'Unknown error occurred while triggering processing';

        await jobStateService.updateJobState(jobId, {
          state: 'failed',
          message: errorMessage,
          progress: 0
        });
        throw error;
      }
    } catch (error: any) {
      console.error('\n❌ Failed to trigger processing:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      await jobStateService.updateJobState(jobId, {
        state: 'failed',
        message: 'Failed to start processing. Please try again.',
        progress: 0
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: 'Failed to start sync job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start the server if not in Vercel environment
if (!process.env.VERCEL) {
  const server = app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    
    if (process.env.NODE_ENV !== 'production') {
      // Start worker for local development
      try {
        await startWorker();
      } catch (error) {
        console.error('Worker start error:', error);
      }
    }
  });

  // Handle shutdown
  const cleanup = async () => {
    console.log('Server shutting down...');
    server.close();
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

export default app;
