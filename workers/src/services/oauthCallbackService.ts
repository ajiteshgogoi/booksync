import { KVJobStore } from './kvJobStore';
import { NotionClient, setOAuthToken } from '@booksync/shared/src/services/notionClient';
import { NotionStore } from '@booksync/shared/src/services/notionStore';
import type { NotionToken } from '@booksync/shared/src/types/notion';

interface ExtendedNotionToken extends NotionToken {
  authToken: string;
  userId: string;
  workspaceId: string;
  expiresAt: number;
}
import { createKVStore } from '@booksync/shared';
import type { Environment } from '../types/env';
import type { CreateJobParams } from '../types/job';

export class OAuthCallbackService {
  private jobStore: KVJobStore;
  private notionClient: NotionClient;
  private env: Environment;

  constructor(env: Environment) {
    this.env = env;
    // Validate KV namespaces
    if (!env.OAUTH_STORE) {
      throw new Error('OAUTH_STORE KV namespace is not bound');
    }
    if (!env.JOB_STORE) {
      throw new Error('JOB_STORE KV namespace is not bound');
    }
    
    // Validate Notion credentials
    if (!env.NOTION_CLIENT_ID) {
      throw new Error('NOTION_CLIENT_ID is not configured');
    }
    if (!env.NOTION_CLIENT_SECRET) {
      throw new Error('NOTION_CLIENT_SECRET is not configured');
    }
    if (!env.NOTION_REDIRECT_URI) {
      throw new Error('NOTION_REDIRECT_URI is not configured');
    }

    console.log('Initializing OAuthCallbackService...', {
      hasOauthStore: !!env.OAUTH_STORE,
      hasJobStore: !!env.JOB_STORE,
      redirectUri: env.NOTION_REDIRECT_URI
    });

    try {
      // Initialize stores in correct order
      this.jobStore = new KVJobStore(env.JOB_STORE);

      // Create stores for Notion
      // Create KV store with explicit validation
      if (!env.OAUTH_STORE) {
        throw new Error('OAUTH_STORE is undefined');
      }

      const kvStore = createKVStore(env.OAUTH_STORE);
      if (!kvStore) {
        throw new Error('Failed to create KV store');
      }

      // Initialize NotionStore with validated KV store
      const notionStore = new NotionStore(kvStore);
      if (!notionStore) {
        throw new Error('Failed to create Notion store');
      }

      // Initialize Notion client with validated store
      this.notionClient = new NotionClient({
        store: notionStore,
        clientId: env.NOTION_CLIENT_ID,
        clientSecret: env.NOTION_CLIENT_SECRET,
        redirectUri: env.NOTION_REDIRECT_URI
      });

      console.log('OAuthCallbackService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OAuthCallbackService:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<{ 
    id: string;
    email?: string;
    workspaceId: string;
  }> {
    try {
      console.log('Verifying token...');
      
      // Validate token format
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format');
      }

      // Get token data from KV store
      const tokenData = await this.notionClient.getToken(token);
      if (!tokenData) {
        throw new Error('Token not found');
      }

      // Check if token is expired
      const now = Date.now();
      if (tokenData.expires_at && now > tokenData.expires_at) {
        throw new Error('Token expired');
      }

      // Extract user information
      if (!tokenData.owner || tokenData.owner.type !== 'user' || !tokenData.owner.user?.id) {
        throw new Error('Invalid token: missing user information');
      }

      return {
        id: tokenData.owner.user.id,
        email: tokenData.owner.user.email,
        workspaceId: tokenData.workspace_id
      };
    } catch (error) {
      console.error('Token verification failed:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async handleCallback(code: string): Promise<{ redirectUrl: string; authToken: string }> {
    try {
      console.log('Starting OAuth callback handling...');

      // Exchange code for access token with logging
      console.log('Exchanging code for token...');
      const tokenData: NotionToken = await this.notionClient.exchangeCodeForToken(code);

      // Validate token data
      console.log('Validating token data...');
      if (!tokenData?.access_token) {
        throw new Error('Missing access_token in token data');
      }
      if (!tokenData?.workspace_id) {
        throw new Error('Missing workspace_id in token data');
      }
      if (!tokenData?.owner) {
        throw new Error('Missing owner in token data');
      }

      // Get user ID from token data with proper type checking
      console.log('Extracting user ID...');
      let userId = 'unknown';
      if (tokenData.owner.type === 'user' && tokenData.owner.user?.id) {
        userId = tokenData.owner.user.id;
      } else {
        console.log('No user ID found in token data, using default:', userId);
      }

      // Generate auth token
      const authToken = crypto.randomUUID();
      
      console.log('Storing auth token mapping...', {
        authToken,
        userId,
        workspaceId: tokenData.workspace_id
      });

      // Store auth token mapping using NotionClient's setOAuthToken method
      const extendedToken: ExtendedNotionToken = {
        ...tokenData,
        authToken,
        userId,
        workspaceId: tokenData.workspace_id,
        expiresAt: Date.now() + (1000 * 60 * 60 * 24 * 7) // 1 week
      };
      await setOAuthToken(this.notionClient.store, extendedToken);

      console.log('Auth token stored successfully');

      // Build redirect URL with auth token
      console.log('Building redirect URL...');
      const clientUrl = new URL(this.env.CLIENT_URL || 'http://localhost:5173');
      clientUrl.searchParams.set('status', 'success');
      clientUrl.searchParams.set('workspaceId', tokenData.workspace_id);
      clientUrl.searchParams.set('authToken', authToken);

      const redirectUrl = clientUrl.toString();
      console.log('Redirecting to:', redirectUrl);

      return { 
        redirectUrl,
        authToken 
      };
    } catch (error) {
      console.error('OAuth callback error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}
