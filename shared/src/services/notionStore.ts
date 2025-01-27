import type { KVStore } from './kvStore';
import type { NotionToken } from '../types/notion';

const TOKEN_KEY_PREFIX = 'notion_token:';
const DB_KEY_PREFIX = 'notion_db:';

export class NotionStore {
  constructor(private kvStore: KVStore) {}

  private getTokenKey(workspaceId: string): string {
    return `${TOKEN_KEY_PREFIX}${workspaceId}`;
  }

  private getDbKey(workspaceId: string): string {
    return `${DB_KEY_PREFIX}${workspaceId}`;
  }

  async getToken(workspaceId: string): Promise<NotionToken | null> {
    const tokenJson = await this.kvStore.get(this.getTokenKey(workspaceId));
    return tokenJson ? JSON.parse(tokenJson) : null;
  }

  async setToken(token: NotionToken): Promise<void> {
    // Validate required fields
    if (!token.access_token) {
      throw new Error('Invalid token data - missing access_token');
    }
    if (token.token_type !== 'bearer') {
      throw new Error('Invalid token data - token_type must be "bearer"');
    }
    if (!token.bot_id) {
      throw new Error('Invalid token data - missing bot_id');
    }
    if (!token.workspace_name) {
      throw new Error('Invalid token data - missing workspace_name');
    }
    if (!token.workspace_id) {
      throw new Error('Invalid token data - missing workspace_id');
    }
    if (!token.owner?.type) {
      throw new Error('Invalid token data - missing owner.type');
    }

    await this.kvStore.set(
      this.getTokenKey(token.workspace_id),
      JSON.stringify(token)
    );
  }

  async deleteToken(workspaceId: string): Promise<void> {
    await this.kvStore.delete(this.getTokenKey(workspaceId));
  }

  async getDatabaseId(workspaceId: string): Promise<string | null> {
    return this.kvStore.get(this.getDbKey(workspaceId));
  }

  async setDatabaseId(workspaceId: string, databaseId: string): Promise<void> {
    await this.kvStore.set(this.getDbKey(workspaceId), databaseId);
  }
}
