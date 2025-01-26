export interface NotionUser {
  id: string;
  name?: string;
  avatar_url?: string;
  type?: 'person' | 'bot';
  email?: string;
  person?: {
    email?: string;
  };
}

export interface NotionWorkspace {
  id: string;
  name: string;
  icon?: string;
}

export interface NotionBotUser {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface NotionToken {
  access_token: string;
  token_type: 'bearer';
  bot_id: string;
  workspace_name: string;
  workspace_icon: string | null;
  workspace_id: string;
  owner: {
    type: 'workspace' | 'user';
    workspace?: NotionWorkspace;
    user?: NotionUser;
  };
  duplicated_template_id?: string | null;
  request_id?: string;
  refresh_token?: string;
  expires_in?: number;
  received_at?: number;
  expires_at?: number;
}
