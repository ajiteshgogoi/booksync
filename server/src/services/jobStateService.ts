import { logger } from '../utils/logger.js';
import { uploadObject, downloadObject } from './r2Service.js';
import { JobStatus } from '../types/job.js';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const JOB_STATE_PREFIX = 'jobs/';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || ''
  }
});

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
    try {
      const jobs = await this.listAllJobs();
      return jobs.filter(job => !this.isTerminalState(job.state));
    } catch (error) {
      logger.error('Error listing pending jobs:', error);
      return [];
    }
  }

  async listJobsByState(state: JobStatus['state']): Promise<JobMetadata[]> {
    try {
      const jobs = await this.listAllJobs();
      return jobs.filter(job => job.state === state);
    } catch (error) {
      logger.error('Error listing jobs by state:', { state, error });
      return [];
    }
  }

  async listJobsByUser(userId: string): Promise<JobMetadata[]> {
    try {
      const jobs = await this.listAllJobs();
      return jobs.filter(job => job.userId === userId);
    } catch (error) {
      logger.error('Error listing jobs by user:', { userId, error });
      return [];
    }
  }

  async listAllJobs(): Promise<JobMetadata[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: JOB_STATE_PREFIX
      });

      const response = await s3Client.send(command);
      const jobs: JobMetadata[] = [];
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) {
            try {
              const jobData = await downloadObject(obj.Key);
              const job = JSON.parse(jobData.toString()) as JobMetadata;
              jobs.push(job);
            } catch (error) {
              logger.error('Error parsing job data:', { key: obj.Key, error });
            }
          }
        }
      }
      
      return jobs;
    } catch (error) {
      logger.error('Error listing all jobs:', error);
      return [];
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: this.getJobPath(jobId)
      });
      await s3Client.send(command);
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