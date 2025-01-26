import type { Job, JobStatus, CreateJobParams } from '../types/job';

export class KVJobStore {
  constructor(private jobStore: KVNamespace) {}

  async createJob(params: CreateJobParams): Promise<Job> {
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

    await this.jobStore.put(jobId, JSON.stringify(job));
    
    // Store job ID in user's job list
    const userJobListKey = `user:${params.userId}:jobs`;
    const userJobs = await this.getUserJobs(params.userId);
    userJobs.push(jobId);
    await this.jobStore.put(userJobListKey, JSON.stringify(userJobs));

    return job;
  }

  async getJob(jobId: string): Promise<Job | null> {
    const jobStr = await this.jobStore.get(jobId);
    return jobStr ? JSON.parse(jobStr) : null;
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<Job | null> {
    const job = await this.getJob(jobId);
    if (!job) return null;

    const updatedJob: Job = {
      ...job,
      ...updates,
      updatedAt: Date.now()
    };

    await this.jobStore.put(jobId, JSON.stringify(updatedJob));
    return updatedJob;
  }

  async listJobs(userId: string, status?: JobStatus): Promise<Job[]> {
    const userJobs = await this.getUserJobs(userId);
    const jobs: Job[] = [];

    for (const jobId of userJobs) {
      const job = await this.getJob(jobId);
      if (job && (!status || job.status === status)) {
        jobs.push(job);
      }
    }

    return jobs;
  }

  async cleanupJobs(): Promise<number> {
    const { keys } = await this.jobStore.list();
    const now = Date.now();
    let cleanedCount = 0;

    for (const key of keys) {
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
    }

    return cleanedCount;
  }

  private async getUserJobs(userId: string): Promise<string[]> {
    const userJobListKey = `user:${userId}:jobs`;
    const jobList = await this.jobStore.get(userJobListKey);
    return jobList ? JSON.parse(jobList) : [];
  }
}