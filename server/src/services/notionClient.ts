import { Client } from '@notionhq/client';
import { storeOAuthToken, getOAuthToken, refreshOAuthToken, deleteOAuthToken } from './redisService.js';
import axios from 'axios';
import type { NotionToken } from '../types.js';

let _client: Client | null = null;

export async function setOAuthToken(tokenData: NotionToken): Promise<void> {
  try {
    // Store the workspace ID as the key since we don't have user IDs
    const workspaceId = tokenData.workspace_id;
    if (!workspaceId) {
      throw new Error('No workspace ID in token data');
    }

    // Store the token data
    await storeOAuthToken(JSON.stringify(tokenData), workspaceId);
    
    // Update the client
    _client = new Client({
      auth: tokenData.access_token,
    });
  } catch (error) {
    console.error('Failed to set OAuth token:', error);
    throw error;
  }
}

export async function getClient(): Promise<Client> {
  try {
    if (!_client) {
      const tokenData = await getOAuthToken();
      if (!tokenData) {
        throw new Error('No OAuth token available');
      }
      
      try {
        const data = JSON.parse(tokenData);
        _client = new Client({
          auth: data.access_token,
        });
      } catch (parseError) {
        console.error('Invalid token structure:', tokenData);
        throw new Error('Failed to parse stored token');
      }
    }
    return _client;
  } catch (error) {
    console.error('Failed to get Notion client:', error);
    throw error;
  }
}

export async function refreshToken(): Promise<void> {
  try {
    const currentToken = await getOAuthToken();
    if (!currentToken) {
      throw new Error('No token to refresh');
    }

    let tokenData: NotionToken;
    try {
      tokenData = JSON.parse(currentToken);
    } catch (parseError) {
      console.error('Invalid token structure:', currentToken);
      throw new Error('Failed to parse stored token');
    }

    // If there's no refresh token, we can't refresh
    // This is normal for internal integrations
    if (!tokenData.refresh_token) {
      console.log('No refresh token available - token may be from internal integration');
      return;
    }

    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
    }, {
      auth: {
        username: process.env.NOTION_OAUTH_CLIENT_ID!,
        password: process.env.NOTION_OAUTH_CLIENT_SECRET!,
      }
    });

    await setOAuthToken(response.data);
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await deleteOAuthToken();
    _client = null;
  } catch (error) {
    console.error('Failed to clear auth:', error);
    throw error;
  }
}
