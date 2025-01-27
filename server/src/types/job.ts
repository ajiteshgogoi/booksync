export interface JobStatus {
  state: 'pending' | 'queued' | 'parsed' | 'processing' | 'completed' | 'failed';
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
}