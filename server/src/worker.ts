import { redis, getNextJob, setJobStatus, getJobStatus, JobStatus } from './services/redisService';
import { processSyncJob } from './services/syncService';

async function processJob(jobId: string) {
  try {
    // Check if this is a continuation of a partial job
    const existingStatus = await getJobStatus(jobId);
    const startProgress = existingStatus?.progress || 0;
    
    // Update status to processing
    await setJobStatus(jobId, {
      state: 'processing',
      progress: startProgress,
      message: startProgress > 0 ? 'Resuming sync...' : 'Starting sync...'
    });

    // Process job with progress updates and checkpointing
    await processSyncJob(jobId, async (progress: number, message: string) => {
      // Save progress every 10% or 5 seconds, whichever comes first
      await setJobStatus(jobId, {
        state: 'processing',
        progress,
        message,
        lastCheckpoint: Date.now()
      });
    });

    // Mark job as completed
    await setJobStatus(jobId, {
      state: 'completed',
      progress: 100,
      message: 'Sync completed successfully',
      completedAt: Date.now()
    });
  } catch (error) {
    console.error(`Failed processing job ${jobId}:`, error);
    await setJobStatus(jobId, {
      state: 'failed',
      message: error instanceof Error ? error.message : 'Sync failed'
    });
  }
}

import { Worker, isMainThread, workerData, parentPort } from 'worker_threads';
import os from 'os';

const MAX_WORKERS = Math.max(1, os.cpus().length - 1); // Leave one core for main thread
const WORKER_TIMEOUT = 300000; // 5 minutes per job
const RETRY_DELAYS = [1000, 5000, 15000]; // Exponential backoff delays

if (isMainThread) {
  // Main thread - spawn worker pool
  const workers: Worker[] = [];
  
  function createWorker() {
    const worker = new Worker(__filename);
    worker.on('message', (message) => {
      if (message === 'ready') {
        workers.push(worker);
      }
    });
    worker.on('error', (error) => {
      console.error('Worker error:', error);
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
      // Replace dead worker
      createWorker();
    });
  }

  // Initialize worker pool
  for (let i = 0; i < MAX_WORKERS; i++) {
    createWorker();
  }

  // Job distribution
  async function distributeJobs() {
    while (true) {
      try {
        const jobId = await getNextJob();
        if (jobId && workers.length > 0) {
          const worker = workers.shift()!;
          worker.postMessage({ type: 'job', jobId });
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Job distribution error:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  distributeJobs().catch(error => {
    console.error('Job distributor failed:', error);
    process.exit(1);
  });
} else {
  // Worker thread
  let currentJobId: string | null = null;
  
  async function workerProcessJob(jobId: string) {
    currentJobId = jobId;
    let attempt = 0;
    
    while (attempt < RETRY_DELAYS.length) {
      try {
        const timeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Job timeout')), WORKER_TIMEOUT)
        );
        
        await Promise.race([
          processJob(jobId),
          timeout
        ]);
        
        // Job completed successfully
        parentPort?.postMessage('done');
        return;
      } catch (error) {
        attempt++;
        if (attempt >= RETRY_DELAYS.length) {
          throw error;
        }
        
        const delay = RETRY_DELAYS[attempt - 1];
        console.error(`Job ${jobId} failed (attempt ${attempt}), retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Worker message handler
  parentPort?.on('message', async (message) => {
    if (message.type === 'job') {
      try {
        await workerProcessJob(message.jobId);
      } catch (error) {
        console.error(`Job ${message.jobId} failed after retries:`, error);
        await setJobStatus(message.jobId, {
          state: 'failed',
          message: error instanceof Error ? error.message : 'Sync failed after retries'
        });
      } finally {
        currentJobId = null;
        parentPort?.postMessage('ready');
      }
    }
  });

  // Signal worker is ready
  parentPort?.postMessage('ready');
}
