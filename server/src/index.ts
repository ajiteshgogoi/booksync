import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import multer from 'multer';
import qs from 'querystring';
import { NotionStore, createKVStore } from '../../shared/src/index';

// Configure dotenv
function loadEnv() {
  if (process.env.NODE_ENV !== 'production') {
    config();
    
    if (!process.env.NOTION_OAUTH_CLIENT_ID) {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const serverRoot = join(__dirname, process.env.NODE_ENV === 'development' ? '../..' : '../../../..');
      
      const envPath = join(serverRoot, '.env');
      const result = config({ path: envPath });
      
      if (!result.parsed) {
        throw new Error(`Failed to load .env file from ${envPath}`);
      }
    }
  }
  
  const required = [
    'NOTION_OAUTH_CLIENT_ID',
    'NOTION_OAUTH_CLIENT_SECRET',
    'WORKER_HOST',
    'WORKER_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

loadEnv();

const app: express.Application = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });
const apiBasePath = process.env.NODE_ENV === 'production' ? '/api' : '';

// Initialize stores
const kvStore = createKVStore();
const notionStore = new NotionStore(kvStore);

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://booksync.vercel.app'
  ],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(cookieParser());

// Helper functions
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Forward request to worker
async function forwardToWorker(path: string, method: string, data?: any, headers?: Record<string, string>) {
  try {
    const response = await axios({
      method,
      url: `https://${process.env.WORKER_HOST}${path}`,
      data,
      headers: {
        'x-api-key': process.env.WORKER_API_KEY!,
        ...headers
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Worker request failed (${path}):`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      path,
      method,
      workerHost: process.env.WORKER_HOST,
      timestamp: new Date().toISOString()
    });

    // Handle specific axios errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Worker responded with error status
        throw new Error(error.response.data?.error || `Worker responded with ${error.response.status}`);
      } else if (error.request) {
        // Request made but no response
        throw new Error('Worker is not responding. Please try again later.');
      }
    }
    
    throw new Error('Failed to communicate with worker service');
  }
}

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
  res.status(200).json(config);
});

// File upload endpoint
app.post(`${apiBasePath}/upload`, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.headers['x-user-id'];
    const workspaceId = req.headers['x-workspace-id'];

    if (!userId || !workspaceId) {
      return res.status(400).json({ error: 'Missing user ID or workspace ID' });
    }

    // Create form data for worker
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: 'text/plain' });
    formData.append('file', blob, req.file.originalname);
    formData.append('userId', userId as string);
    formData.append('workspaceId', workspaceId as string);

    // Forward to worker
    const job = await forwardToWorker('/upload', 'POST', formData);
    res.json(job);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    });
  }
});

// Job status endpoint
app.get(`${apiBasePath}/jobs/:jobId`, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    const job = await forwardToWorker(`/jobs/${jobId}`, 'GET', null, {
      'x-user-id': userId as string
    });
    res.json(job);
  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to get job status' 
    });
  }
});

// Notion OAuth routes
app.get(`${apiBasePath}/auth/notion`, (req: Request, res: Response) => {
  try {
    const state = generateState();
    const clientId = process.env.NOTION_OAUTH_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;

    if (!clientId) {
      return res.status(500).json({
        error: 'OAuth configuration error',
        details: 'Client ID is not properly configured'
      });
    }

    const authUrl = `https://api.notion.com/v1/oauth/authorize?${
      qs.stringify({
        client_id: clientId,
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
  } catch (error) {
    console.error('OAuth initialization failed:', error);
    res.status(500).json({
      error: 'OAuth initialization failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Authentication status check
app.post(`${apiBasePath}/auth/check`, async (req: Request, res: Response) => {
  try {
    // Basic token validation
    const authToken = req.cookies.auth_token;
    if (!authToken || typeof authToken !== 'string' || authToken.length < 64) {
      return res.status(401).json({ 
        authenticated: false,
        error: 'Invalid or missing authentication token'
      });
    }

    // Verify token with worker service
    let user;
    try {
      user = await forwardToWorker('/auth/verify', 'POST', { token: authToken });
    } catch (error) {
      console.error('Worker verification failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      // Clear invalid token
      res.clearCookie('auth_token', {
        path: '/',
        domain: process.env.NODE_ENV === 'production' ? '.booksync.vercel.app' : undefined
      });
      
      return res.status(401).json({ 
        authenticated: false,
        error: 'Authentication verification failed'
      });
    }

    // Set auth cookie with consistent configuration
    const cookieConfig: express.CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.booksync.vercel.app' : undefined
    };
    
    // Only set cookie if it's different from existing
    if (req.cookies.auth_token !== authToken) {
      res.cookie('auth_token', authToken, cookieConfig);
    }
    
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        workspaceId: user.workspaceId
      }
    });
  } catch (error) {
    console.error('Auth check error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      headers: req.headers,
      cookies: req.cookies
    });
    res.status(401).json({ 
      authenticated: false,
      error: error instanceof Error ? error.message : 'Authentication check failed',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
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
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    
    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }, {
      auth: {
        username: process.env.NOTION_OAUTH_CLIENT_ID!,
        password: process.env.NOTION_OAUTH_CLIENT_SECRET!,
      }
    });

    const token = response.data;
    const workspaceId = token.workspace_id;
    
    // Store the token
    await notionStore.setToken(token);

    res.redirect(`${process.env.CLIENT_URL}?auth=success&workspaceId=${workspaceId}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}?error=Failed to complete OAuth flow`);
  }
});

// Start server if not in Vercel environment
if (!process.env.VERCEL) {
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  const cleanup = async () => {
    console.log('Server shutting down...');
    server.close();
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
}

export default app;
