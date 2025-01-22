// Notion OAuth token structure
export interface NotionToken {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_name: string;
  workspace_icon: string;
  workspace_id: string;
  owner: {
    type: string;
    user: {
      object: string;
      id: string;
      name: string;
      avatar_url: string;
      type: string;
      person: any;
    };
  };
  duplicated_template_id: string | null;
  request_id: string;
  expires_in: number;
  refresh_token?: string;  // Optional since internal integrations don't have refresh tokens
}

// Job-related types
export interface Job {
  id: string;
  status: string;
  progress: number;
  total?: number;
  error?: string;
}
