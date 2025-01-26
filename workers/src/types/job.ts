export type JobStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired';

export interface Job {
  id: string;
  userId: string;
  workspaceId: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: string;
  expiresAt?: number;
  fileKey?: string;
  progress?: number;
  error?: string;
}

export interface CreateJobParams {
  userId: string;
  workspaceId: string;
  fileKey: string;
  expiresAt: number;
}
