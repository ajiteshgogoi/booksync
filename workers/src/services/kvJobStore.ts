import type { Job, JobStatus, CreateJobParams } from '../types/job';

export class KVJobStore {
  constructor(private jobStore: KVNamespace) {
    if (!jobStore) {
      throw new Error('KVJobStore requires a valid KVNamespace');
    }
  }

  async createJob(params: CreateJobParams): Promise<Job> {
    try {
      console.log('Creating new job...', {
        userId: params.userId,
        workspaceId: params.workspaceId,
        fileKey: params.fileKey
      });

      if (!params.userId || !params.workspaceId || !params.fileKey) {
        throw new Error('Missing required job parameters');
      }

      const jobId = crypto.randomUUID();
      
      const job: Job = {
        id: jobId,
        userId: params.userId,
        workspaceId: params.workspaceId,
        fileKey: params.fileKey,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: params.expiresAt
      };

      // Store job data
      console.log('Storing job data...', { jobId });
      await this.jobStore.put(jobId, JSON.stringify(job));
      
      // Store job ID in user's job list
      const userJobListKey = `user:${params.userId}:jobs`;
      console.log('Updating user job list...', { userJobListKey });
      const userJobs = await this.getUserJobs(params.userId);
      userJobs.push(jobId);
      await this.jobStore.put(userJobListKey, JSON.stringify(userJobs));

      console.log('Job created successfully', { jobId });
      return job;
    } catch (error) {
      console.error('Failed to create job:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        params
      });
      throw error;
    }
  }

  async getJob(jobId: string): Promise<Job | null> {
    try {
      console.log('Fetching job...', { jobId });
      
      if (!jobId) {
        throw new Error('Job ID is required');
      }

      const jobStr = await this.jobStore.get(jobId);
      if (!jobStr) {
        console.log('Job not found', { jobId });
        return null;
      }

      try {
        const job = JSON.parse(jobStr);
        console.log('Job fetched successfully', {
          jobId,
          status: job.status,
          updatedAt: new Date(job.updatedAt).toISOString()
        });
        return job;
      } catch (parseError) {
        console.error('Failed to parse job data:', {
          jobId,
          error: parseError instanceof Error ? parseError.message : 'Unknown error',
          jobStr
        });
        throw new Error('Invalid job data format');
      }
    } catch (error) {
      console.error('Error fetching job:', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
    try {
      console.log('Updating job...', { jobId, updates });

      const job = await this.getJob(jobId);
      if (!job) {
        console.log('Job not found for update', { jobId });
        return null;
      }

      const updatedJob: Job = {
        ...job,
        ...updates,
        updatedAt: Date.now()
      };

      await this.jobStore.put(jobId, JSON.stringify(updatedJob));
      console.log('Job updated successfully', { jobId, status: updatedJob.status });
      
      return updatedJob;
    } catch (error) {
      console.error('Failed to update job:', {
        jobId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        updates
      });
      throw error;
    }
  }

  async listJobs(userId: string, status?: JobStatus): Promise<Job[]> {
    try {
      console.log('Listing jobs...', { userId, status });
      
      const userJobs = await this.getUserJobs(userId);
      const jobs: Job[] = [];

      for (const jobId of userJobs) {
        try {
          const job = await this.getJob(jobId);
          if (job && (!status || job.status === status)) {
            jobs.push(job);
          }
        } catch (error) {
          console.error('Error fetching job in list:', { jobId, error });
          // Continue with other jobs even if one fails
          continue;
        }
      }

      console.log('Jobs listed successfully', {
        userId,
        status,
        count: jobs.length
      });
      
      return jobs;
    } catch (error) {
      console.error('Failed to list jobs:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async cleanupJobs(): Promise<number> {
    try {
      console.log('Starting job cleanup...');
      
      const { keys } = await this.jobStore.list();
      const now = Date.now();
      let cleanedCount = 0;

      for (const key of keys) {
        try {
          // Skip user job list keys
          if (key.name.startsWith('user:')) continue;

          const jobStr = await this.jobStore.get(key.name);
          if (!jobStr) continue;

          const job: Job = JSON.parse(jobStr);
          
          if (
            (job.expiresAt && job.expiresAt < now) ||
            ((job.status === 'completed' || job.status === 'failed') &&
              job.updatedAt < now - 24 * 60 * 60 * 1000)
          ) {
            await this.jobStore.delete(key.name);
            
            // Remove from user's job list
            const userJobListKey = `user:${job.userId}:jobs`;
            const userJobs = await this.getUserJobs(job.userId);
            const updatedJobs = userJobs.filter(id => id !== job.id);
            await this.jobStore.put(userJobListKey, JSON.stringify(updatedJobs));
            
            cleanedCount++;
          }
        } catch (error) {
          console.error('Error cleaning up job:', {
            key: key.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          // Continue with other jobs even if one fails
          continue;
        }
      }

      console.log('Job cleanup completed', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup jobs:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async getUserJobs(userId: string): Promise<string[]> {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const userJobListKey = `user:${userId}:jobs`;
      const jobList = await this.jobStore.get(userJobListKey);
      return jobList ? JSON.parse(jobList) : [];
    } catch (error) {
      console.error('Failed to get user jobs:', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}