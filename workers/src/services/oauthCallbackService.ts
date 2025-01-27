import { KVJobStore } from './kvJobStore';
import { NotionClient, NotionStore } from '@booksync/shared';
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
      clientSecret: env.NOTION_CLIENT_SECRET
    });
  }

  async handleCallback(code: string): Promise<{ redirectUrl: string }> {
    // Exchange code for access token
    const tokenData = await this.notionClient.exchangeCodeForToken(code);
    if (!tokenData) {
      throw new Error('Failed to exchange code for token');
    }

    // Create sync job with temporary file key since we don't have a file yet
    const jobParams: CreateJobParams = {
      userId: tokenData.owner.user?.id || 'unknown',
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