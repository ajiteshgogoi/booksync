export interface JobStatus {
  state: 'pending' | 'processing' | 'completed' | 'failed' | 'queued' | 'parsed';
  progress?: number;
  message?: string;
  result?: any;
  total?: number;
  lastCheckpoint?: number;
  completedAt?: number;
  lastProcessedIndex?: number;
  userId?: string;  // Optional for backward compatibility
  uploadId?: string; // Added for upload tracking
  errorDetails?: string;
  parsedKey?: string;  // Key for parsed highlights in R2
}