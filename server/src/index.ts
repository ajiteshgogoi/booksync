import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { syncHighlights } from './services/syncService';
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
app.get(`${apiBasePath}/auth/check`, (req, res) => {
  const token = getOAuthToken();
  if (token && token.access_token) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
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
  const { code, state, error } = req.query;
  const storedState = req.cookies.oauth_state;

  if (error === 'access_denied') {
    // User cancelled the OAuth flow
    const redirectUrl = new URL(process.env.CLIENT_URL || 'http://localhost:5173');
    redirectUrl.searchParams.set('auth', 'cancelled');
    return res.redirect(redirectUrl.toString());
  }

  if (!code || !state || state !== storedState) {
    return res.redirect(`${process.env.CLIENT_URL}?auth=error`);
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
    res.status(500).json({ error: 'Failed to complete OAuth flow' });
  }
});

app.post(`${apiBasePath}/auth/refresh`, async (req, res) => {
  try {
    await refreshOAuthToken();
    res.status(200).json({ token: getOAuthToken() });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

app.post(`${apiBasePath}/auth/disconnect`, (req, res) => {
  try {
    clearAuth();
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

// Sync endpoint for uploading MyClippings.txt with progress streaming
app.post(`${apiBasePath}/sync`, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const fileContent = req.file.buffer.toString('utf-8');
    const highlights = parseClippings(fileContent);
    let syncedCount = 0;

    // Create a progress callback
    const onProgress = (count: number) => {
      res.write(JSON.stringify({ type: 'progress', count }));
    };

    // Sync highlights with progress reporting
    await syncHighlights(fileContent, onProgress);
    
    res.end();
  } catch (error) {
    console.error('Sync error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to sync highlights' });
    } else {
      res.end(JSON.stringify({ type: 'error', message: 'Failed to sync highlights' }));
    }
  }
});

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

export default app;
