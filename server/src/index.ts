import express from 'express';
import type { Request, Response } from 'express';
import type { Express } from 'express-serve-static-core';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Configure dotenv for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env');
config({ path: envPath });

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
import { setJobStatus } from './services/redisService.js';
import { triggerProcessing } from './services/githubService.js';
import { setOAuthToken, getClient, refreshToken, clearAuth } from './services/notionClient.js';
import { parseClippings } from './utils/parseClippings.js';
import qs from 'querystring';
import cookieParser from 'cookie-parser';

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

// Use API base path for Vercel deployment
const apiBasePath = process.env.NODE_ENV === 'production' ? '/api' : '';

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Generate random state for OAuth
function generateState() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Health check endpoint
app.get(`${apiBasePath}/health`, (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
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
          'Authorization': `token ${token}`,
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
          'Authorization': `token ${token}`,
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
        format: token.startsWith('ghp_') ? 'Fine-grained token' :
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
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File size:', req.file.size, 'bytes');
    const fileContent = req.file.buffer.toString('utf-8');
    console.log('File content preview:', fileContent.slice(0, 200));

    const highlights = parseClippings(fileContent);
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
    const client = await getClient();
    if (client) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Failed to check authentication status' });
  }
});

// Notion OAuth routes
app.get(`${apiBasePath}/auth/notion`, (req: Request, res: Response) => {
  const state = generateState();
  const redirectUri = process.env.NOTION_REDIRECT_URI;
  
  if (!redirectUri) {
    return res.status(500).json({ error: 'Missing redirect URI configuration' });
  }

  const authUrl = `https://api.notion.com/v1/oauth/authorize?${
    qs.stringify({
      client_id: process.env.NOTION_OAUTH_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
    })
  }`;

  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  res.redirect(authUrl);
});

app.get(`${apiBasePath}/auth/notion/callback`, async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const storedState = req.cookies.oauth_state;

  if (!code || !state || state !== storedState) {
    return res.redirect(`${process.env.CLIENT_URL}?error=Invalid OAuth state`);
  }

  try {
    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.NOTION_REDIRECT_URI,
    }, {
      auth: {
        username: process.env.NOTION_OAUTH_CLIENT_ID!,
        password: process.env.NOTION_OAUTH_CLIENT_SECRET!,
      }
    });

    await setOAuthToken(response.data);
    
    res.redirect(`${process.env.CLIENT_URL}?auth=success`);
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
    await clearAuth();
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
    
    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', {
      size: req.file.size,
      mimeType: req.file.mimetype
    });

    if (!Buffer.isBuffer(req.file.buffer)) {
      console.error('Invalid file format - buffer missing');
      throw new Error('Invalid file format');
    }
    
    const fileContent = req.file.buffer.toString('utf-8');
    if (typeof fileContent !== 'string') {
      console.error('Failed to convert file content to string');
      throw new Error('Failed to convert file content to string');
    }

    // Validate file content
    if (!fileContent.includes('==========')) {
      console.error('Invalid My Clippings file format');
      throw new Error('Invalid My Clippings file format');
    }

    const userId = req.user?.id || 'default-user-id';
    console.log('Processing for user:', userId);
    
    // Start by creating a job ID
    const jobId = `sync:${userId}:${Date.now()}`;
    console.log('Created job ID:', jobId);
    
    // Set initial status in Redis
    await setJobStatus(jobId, {
      state: 'queued',
      progress: 0,
      message: 'Uploading highlights for processing',
      total: 0
    });
    console.log('Job status set in Redis');

    console.log('\n=== Upload Processing Start ===');
    console.log('File content length:', fileContent.length);
    console.log('Preview:', fileContent.slice(0, 200));
    
    // Return immediate response with job ID
    res.json({
      success: true,
      jobId,
      message: 'Upload received. Processing will begin shortly.',
      info: 'Your highlights will be processed in GitHub Actions. You can safely close this page - progress is automatically saved.'
    });

    // Trigger GitHub workflow in background
    try {
      console.log('\nTrigger Details:', {
        fileContentLength: fileContent.length,
        userId,
        jobId,
        githubTokenPresent: !!process.env.GITHUB_ACCESS_TOKEN
      });
      
      console.log('Calling triggerProcessing...');
      try {
        await triggerProcessing(fileContent, userId);
        console.log('\n✅ Successfully triggered GitHub processing for job:', jobId);
      } catch (error) {
        console.error('Failed to trigger GitHub processing:', error);
        await setJobStatus(jobId, {
          state: 'failed',
          message: 'Failed to trigger processing',
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
      await setJobStatus(jobId, {
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

// For local development, start the server and continuous worker
if (!process.env.VERCEL) {
  let workerInterval: NodeJS.Timeout;

  // Start the server
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    
    // Start continuous background worker for local development
    workerInterval = setInterval(async () => {
      try {
        await startWorker();
      } catch (error) {
        console.error('Worker iteration error:', error);
      }
    }, 30000); // Run every 30 seconds in development
  });

  // Handle shutdown
  process.on('SIGTERM', () => {
    console.log('Server shutting down...');
    if (workerInterval) {
      clearInterval(workerInterval);
    }
  });
}

export default app;
