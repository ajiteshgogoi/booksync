export interface Environment {
  // Namespaces
  OAUTH_STORE: KVNamespace;
  JOB_STORE: DurableObjectNamespace;
  HIGHLIGHTS_BUCKET: R2Bucket;

  // Notion OAuth credentials
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
  NOTION_REDIRECT_URI: string;

  // Worker configuration
  WORKER_HOST: string;
}

// R2 object metadata
export interface HighlightFileMetadata {
  userId: string;
  workspaceId: string;
  originalName: string;
  uploadTime: string;
}

export interface R2ObjectWithMetadata extends R2Object {
  metadata: HighlightFileMetadata;
}
