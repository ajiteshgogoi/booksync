import { logger } from '../utils/logger.js';
import { uploadObject, downloadObject } from './r2Service.js';
import { JobStatus } from '../types/job.js';

const JOB_STATE_PREFIX = 'jobs/';

export interface JobMetadata extends JobStatus {
  jobId: string;
  fileName: string;
  databaseId: string;
  createdAt: number;
  updatedAt: number;
}

export class JobStateService {
  private static instance: JobStateService;

  private constructor() {}

  static getInstance(): JobStateService {
    if (!JobStateService.instance) {
      JobStateService.instance = new JobStateService();
    }
    return JobStateService.instance;
  }

  private getJobPath(jobId: string): string {
    return `${JOB_STATE_PREFIX}${jobId}.json`;
  }

  async createJob(params: {
    jobId: string;
    fileName: string;
    userId: string;
    databaseId: string;
    uploadId?: string;
  }): Promise<JobMetadata> {
    const jobState: JobMetadata = {
      ...params,
      state: 'pending', // Initial state when file is uploaded
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await this.saveJobState(jobState);
    return jobState;
  }

  async getJobState(jobId: string): Promise<JobMetadata | null> {
    try {
      const data = await downloadObject(this.getJobPath(jobId));
      return JSON.parse(data.toString());
    } catch (error) {
      logger.error('Error getting job state:', { jobId, error });
      return null;
    }
  }

  async updateJobState(jobId: string, updates: Partial<JobStatus>): Promise<JobMetadata | null> {
    try {
      const currentState = await this.getJobState(jobId);
      if (!currentState) {
        return null;
      }

      // Validate state transitions
      if (updates.state) {
        const isValidTransition = this.validateStateTransition(currentState.state, updates.state);
        if (!isValidTransition) {
          throw new Error(`Invalid state transition from ${currentState.state} to ${updates.state}`);
        }
      }

      const updatedState: JobMetadata = {
        ...currentState,
        ...updates,
        updatedAt: Date.now()
      };

      await this.saveJobState(updatedState);
      return updatedState;
    } catch (error) {
      logger.error('Error updating job state:', { jobId, error });
      return null;
    }
  }

  private validateStateTransition(fromState: JobStatus['state'], toState: JobStatus['state']): boolean {
    const validTransitions: Record<JobStatus['state'], JobStatus['state'][]> = {
      'pending': ['queued'],
      'queued': ['parsed', 'failed'],
      'parsed': ['processing', 'failed'],
      'processing': ['completed', 'failed'],
      'completed': [], // Terminal state
      'failed': []    // Terminal state
    };

    return validTransitions[fromState]?.includes(toState) || false;
  }

  private async saveJobState(state: JobMetadata): Promise<void> {
    try {
      await uploadObject(this.getJobPath(state.jobId), JSON.stringify(state));
    } catch (error) {
      logger.error('Error saving job state:', { jobId: state.jobId, error });
      throw error;
    }
  }

  async listPendingJobs(): Promise<JobMetadata[]> {
    // Note: This is a placeholder that will need proper R2 list implementation
    // You would need to:
    // 1. List all objects with prefix JOB_STATE_PREFIX
    // 2. Download each job state
    // 3. Filter for non-terminal states (not completed or failed)
    return [];
  }

  async listJobsByState(state: JobStatus['state']): Promise<JobMetadata[]> {
    // Similar placeholder - would need R2 list implementation
    // This would be particularly useful for finding 'parsed' jobs ready for processing
    return [];
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      // Upload empty content to effectively delete the file
      await uploadObject(this.getJobPath(jobId), '');
    } catch (error) {
      logger.error('Error deleting job state:', { jobId, error });
      throw error;
    }
  }

  // Utility method to check if a job is in a terminal state
  isTerminalState(state: JobStatus['state']): boolean {
    return state === 'completed' || state === 'failed';
  }
}

export const jobStateService = JobStateService.getInstance();