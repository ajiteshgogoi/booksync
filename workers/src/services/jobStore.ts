import type { Job, JobStatus, CreateJobParams } from '../types/job';

export class JobStore implements DurableObject {
  state: DurableObjectState;
  jobs: Map<string, Job>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.jobs = new Map();
    this.initialize();
  }

  // Initialize state from storage
  private async initialize() {
    const stored = await this.state.storage.list<Job>();
    for (const [key, value] of stored) {
      this.jobs.set(key, value);
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/create':
        return this.handleCreateJob(request);
      case '/status':
        return this.handleGetStatus(request);
      case '/update':
        return this.handleUpdateJob(request);
      case '/list':
        return this.handleListJobs(request);
      case '/cleanup':
        return this.handleCleanupJobs();
      default:
        return new Response('Not found', { status: 404 });
    }
  }

  private async handleCreateJob(request: Request): Promise<Response> {
    const { userId, workspaceId, fileKey, expiresAt } = await request.json<CreateJobParams>();
    const jobId = crypto.randomUUID();
    
    const job: Job = {
      id: jobId,
      userId,
      workspaceId,
      fileKey,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt
    };

    this.jobs.set(jobId, job);
    await this.state.storage.put(jobId, job);

    return new Response(JSON.stringify(job), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleGetStatus(request: Request): Promise<Response> {
    const jobId = new URL(request.url).searchParams.get('id');
    if (!jobId) {
      return new Response('Missing job ID', { status: 400 });
    }

    const job = await this.state.storage.get<Job>(jobId);
    if (!job) {
      return new Response('Job not found', { status: 404 });
    }

    return new Response(JSON.stringify(job), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleUpdateJob(request: Request): Promise<Response> {
    const { id, status, progress, error } = await request.json<Partial<Job>>();
    if (!id) {
      return new Response('Missing job ID', { status: 400 });
    }

    const job = await this.state.storage.get<Job>(id);
    if (!job) {
      return new Response('Job not found', { status: 404 });
    }

    const updatedJob: Job = {
      ...job,
      status: status || job.status,
      progress: progress ?? job.progress,
      error: error ?? job.error,
      updatedAt: Date.now()
    };

    this.jobs.set(id, updatedJob);
    await this.state.storage.put(id, updatedJob);

    return new Response(JSON.stringify(updatedJob), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleListJobs(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as JobStatus | null;
    
    // Filter jobs by status if provided
    let filteredJobs = Array.from(this.jobs.values());
    if (status) {
      filteredJobs = filteredJobs.filter(job => job.status === status);
    }

    return new Response(JSON.stringify(filteredJobs), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleCleanupJobs(): Promise<Response> {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      // Clean up jobs that are expired or completed/failed for more than 24 hours
      if (
        (job.expiresAt && job.expiresAt < now) ||
        ((job.status === 'completed' || job.status === 'failed') &&
          job.updatedAt < now - 24 * 60 * 60 * 1000)
      ) {
        this.jobs.delete(jobId);
        await this.state.storage.delete(jobId);
        cleanedCount++;
      }
    }

    return new Response(JSON.stringify({ cleaned: cleanedCount }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
