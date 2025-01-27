import { KVJobStore } from './kvJobStore';
import { NotionClient, NotionStore, type NotionToken } from '@booksync/shared';
import { createKVStore } from '@booksync/shared';
import type { Environment } from '../types/env';
import type { CreateJobParams } from '../types/job';

export class OAuthCallbackService {
  private jobStore: KVJobStore;
  private notionClient: NotionClient;

  constructor(env: Environment) {
    const kvStore = createKVStore(env.OAUTH_STORE);
    const notionStore = new NotionStore(kvStore);
    
    this.jobStore = new KVJobStore(env.JOB_STORE);
    this.notionClient = new NotionClient({
      store: notionStore,
      clientId: env.NOTION_CLIENT_ID,
      clientSecret: env.NOTION_CLIENT_SECRET,
      redirectUri: env.NOTION_REDIRECT_URI
    });
  }

  async handleCallback(code: string): Promise<{ redirectUrl: string }> {
    // Exchange code for access token and ensure proper typing
    const tokenData: NotionToken = await this.notionClient.exchangeCodeForToken(code);
    if (!tokenData?.access_token || !tokenData?.workspace_id) {
      throw new Error('Failed to exchange code for token or invalid token data');
    }

    // Get user ID from token data with proper type checking
    let userId = 'unknown';
    if (tokenData.owner.type === 'user' && tokenData.owner.user?.id) {
      userId = tokenData.owner.user.id;
    }

    // Create sync job with temporary file key since we don't have a file yet
    const jobParams: CreateJobParams = {
      userId,
      workspaceId: tokenData.workspace_id,
      fileKey: `pending-${tokenData.workspace_id}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    };

    const job = await this.jobStore.createJob(jobParams);

    // Build redirect URL
    const clientUrl = new URL(process.env.CLIENT_URL || 'http://localhost:5173');
    clientUrl.searchParams.set('syncStatus', 'queued');
    clientUrl.searchParams.set('jobId', job.id);

    return { redirectUrl: clientUrl.toString() };
  }
}