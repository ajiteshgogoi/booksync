import express, { Request } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { startWorker } from './worker';

interface User {
  id: string;
}

interface CustomRequest extends Request {
  user?: User;
}
import { processSyncJob, queueSyncJob, getSyncStatus } from './services/syncService';
import { setOAuthToken, getOAuthToken, refreshOAuthToken, clearAuth } from './services/notionClient';
import { parseClippings } from './utils/parseClippings';
import axios from 'axios';
import qs from 'querystring';
import cookieParser from 'cookie-parser';

dotenv.config();

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
app.get(`${apiBasePath}/health`, (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Parse endpoint to get highlight count
app.post(`${apiBasePath}/parse`, upload.single('file'), async (req, res) => {
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
app.get(`${apiBasePath}/auth/check`, async (req, res) => {
  try {
    const token = await getOAuthToken();
    if (token && token.access_token) {
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
app.get(`${apiBasePath}/auth/notion`, (req, res) => {
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

app.get(`${apiBasePath}/auth/notion/callback`, async (req, res) => {
  const { code, state } = req.query;
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

app.post(`${apiBasePath}/auth/refresh`, async (req, res) => {
  try {
    await refreshOAuthToken();
    const token = await getOAuthToken();
    res.status(200).json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Job status endpoint
app.get(`${apiBasePath}/sync/status/:jobId`, async (req, res) => {
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

app.post(`${apiBasePath}/auth/disconnect`, async (req, res) => {
  try {
    await clearAuth();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Sync endpoint for uploading MyClippings.txt
app.post(`${apiBasePath}/sync`, upload.single('file'), async (req: CustomRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!Buffer.isBuffer(req.file.buffer)) {
      throw new Error('Invalid file format');
    }
    
    const fileContent = req.file.buffer.toString('utf-8');
    if (typeof fileContent !== 'string') {
      throw new Error('Failed to convert file content to string');
    }

    // Validate file content
    if (!fileContent.includes('==========')) {
      throw new Error('Invalid My Clippings file format');
    }

    const userId = req.user?.id || 'default-user-id';
    const jobId = await queueSyncJob(userId, fileContent);
    
    // Return success with job ID
    res.json({
      success: true,
      message: 'Sync job started. Your highlights will be processed in the background.',
      jobId
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      error: 'Failed to start sync job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Cron endpoint for processing sync jobs (Vercel production only)
if (process.env.VERCEL) {
  app.get(`${apiBasePath}/cron/process-sync`, async (req, res) => {
    try {
      // Verify the request is from Vercel Cron
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      console.log('Starting cron job for processing syncs...');
      await startWorker();
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Cron job error:', error);
      res.status(500).json({ error: 'Failed to process sync jobs' });
    }
  });
}

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
