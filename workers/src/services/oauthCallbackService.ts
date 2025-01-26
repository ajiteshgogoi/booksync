import { KVJobStore } from './kvJobStore';
import { NotionClient, NotionStore, type NotionToken } from '@booksync/shared';
import { createKVStore } from '@booksync/shared';
import type { Environment } from '../types/env';
import type { CreateJobParams } from '../types/job';

export class OAuthCallbackService {
  private jobStore: KVJobStore;
  private notionClient: NotionClient;

  constructor(env: Environment) {
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
      const kvStore = createKVStore(env.OAUTH_STORE);
      const notionStore = new NotionStore(kvStore);
      
      this.jobStore = new KVJobStore(env.JOB_STORE);
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

  async handleCallback(code: string): Promise<{ redirectUrl: string }> {
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

      // Create sync job with temporary file key
      console.log('Creating sync job...');
      const jobParams: CreateJobParams = {
        userId,
        workspaceId: tokenData.workspace_id,
        fileKey: `pending-${tokenData.workspace_id}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      };

      const job = await this.jobStore.createJob(jobParams);
      console.log('Job created:', job.id);

      // Build redirect URL
      console.log('Building redirect URL...');
      const clientUrl = new URL(process.env.CLIENT_URL || 'http://localhost:5173');
      clientUrl.searchParams.set('syncStatus', 'queued');
      clientUrl.searchParams.set('jobId', job.id);

      const redirectUrl = clientUrl.toString();
      console.log('Redirecting to:', redirectUrl);

      return { redirectUrl };
    } catch (error) {
      console.error('OAuth callback error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}