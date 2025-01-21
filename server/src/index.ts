import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { syncHighlights } from './services/syncService';
import { parseClippings } from './utils/parseClippings';
import { setOAuthToken, getOAuthToken, refreshOAuthToken } from './services/notionClient';
import axios from 'axios';
import qs from 'querystring';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const upload = multer({ storage: multer.memoryStorage() });

// Handle /api prefix in production
const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '';

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Apply API prefix to all routes
app.use(apiPrefix, (req, res, next) => {
  next();
});
app.use(express.json());
app.use(cookieParser());

// Generate random state for OAuth
function generateState() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Notion OAuth routes
app.get('/auth/notion', (req, res) => {
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
    sameSite: 'lax'  // Changed to 'lax' to allow cross-site redirect with state
  });

  res.redirect(authUrl);
});

app.get('/auth/notion/callback', async (req, res) => {
  const { code, state } = req.query;
  const storedState = req.cookies.oauth_state;

  if (!code || !state || state !== storedState) {
    return res.status(400).json({ error: 'Invalid OAuth state' });
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

    setOAuthToken(response.data);
    
    res.redirect(`${process.env.CLIENT_URL}?auth=success`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Failed to complete OAuth flow' });
  }
});

app.post('/auth/refresh', async (req, res) => {
  try {
    await refreshOAuthToken();
    res.status(200).json({ token: getOAuthToken() });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Auth check endpoint
app.get('/auth/check', (req, res) => {
  const token = getOAuthToken();
  if (token && token.access_token) {
    res.status(200).json({ authenticated: true });
  } else {
    res.status(401).json({ authenticated: false });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Parse endpoint to get highlight count
app.post('/parse', upload.single('file'), async (req, res) => {
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

// Sync endpoint for uploading MyClippings.txt with progress streaming
app.post('/sync', upload.single('file'), async (req, res) => {
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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
