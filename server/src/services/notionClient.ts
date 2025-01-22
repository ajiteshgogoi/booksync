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

    // Get database details from the client
    const client = new Client({
      auth: tokenData.access_token,
    });
    
    // Search for databases with the template name
    const response = await client.search({
      query: 'Kindle Highlights Template',
      filter: {
        property: 'object',
        value: 'database'
      }
    });

    if (!response.results.length) {
      throw new Error('No Kindle Highlights database found');
    }

    // Store the token data with database ID
    const tokenWithDatabase = {
      ...tokenData,
      database_id: response.results[0].id
    };
    
    await storeOAuthToken(JSON.stringify(tokenWithDatabase), workspaceId);
    
    // Update the client
    _client = client;
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

interface Highlight {
  bookTitle: string;
  highlight: string;
  location: string;
  date: string;
  hash?: string;
}

export async function updateNotionDatabase(highlights: Highlight[]): Promise<void> {
  try {
    const client = await getClient();
    const tokenData = await getOAuthToken();
    
    if (!tokenData) {
      throw new Error('No OAuth token available');
    }

    const { database_id } = JSON.parse(tokenData);
    if (!database_id) {
      throw new Error('No database ID configured');
    }

    console.log(`Updating Notion database with ${highlights.length} highlights...`);

    for (const highlight of highlights) {
      try {
        await client.pages.create({
          parent: { database_id },
          properties: {
            'Book Title': {
              title: [{ text: { content: highlight.bookTitle } }]
            },
            'Highlight': {
              rich_text: [{ text: { content: highlight.highlight } }]
            },
            'Location': {
              rich_text: [{ text: { content: highlight.location } }]
            },
            'Date': {
              date: { start: highlight.date }
            },
            ...(highlight.hash ? {
              'Hash': {
                rich_text: [{ text: { content: highlight.hash } }]
              }
            } : {})
          }
        });
        console.log(`Added highlight: ${highlight.bookTitle} (${highlight.location})`);
      } catch (error) {
        console.error(`Failed to add highlight: ${highlight.bookTitle}`, error);
        throw error;
      }
    }

    console.log('Successfully updated Notion database');
  } catch (error) {
    console.error('Error updating Notion database:', error);
    throw error;
  }
}
