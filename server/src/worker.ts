import { getRedis, getNextJob, setJobStatus, getJobStatus, JobStatus } from './services/redisService';
import { processSyncJob } from './services/syncService';

const POLLING_INTERVAL = 1000; // 1 second

export async function startWorker() {
  console.log('Starting sync worker...');
  
  // Poll for new jobs
  const pollJobs = async () => {
    try {
      const jobId = await getNextJob();
      if (jobId) {
        console.log('Processing job:', jobId);
        try {
          // Get initial status
          const initialStatus = await getJobStatus(jobId);
          console.debug('Initial job status:', initialStatus);

          // Update status to show we're starting
          await setJobStatus(jobId, {
            state: 'processing',
            progress: 0,
            message: 'Starting to process highlights...'
          });

          await processSyncJob(jobId, async (progress, message) => {
            const newStatus = {
              state: 'processing' as const,
              progress,
              message
            };
            console.debug(`Job ${jobId} progress update:`, newStatus);
            await setJobStatus(jobId, newStatus);
          });

          // Mark as completed
          const completedStatus: JobStatus = {
            state: 'completed' as const,
            progress: 100,
            message: 'Successfully synced all highlights to Notion'
          };
          console.debug(`Job ${jobId} completed with status:`, completedStatus);
          await setJobStatus(jobId, completedStatus);
          console.log('Job completed successfully:', jobId);
        } catch (error) {
          console.error('Error processing job:', jobId, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error details:', errorMessage);
          
          const failedStatus: JobStatus = {
            state: 'failed' as const,
            message: errorMessage
          };
          console.debug(`Job ${jobId} failed with status:`, failedStatus);
          await setJobStatus(jobId, failedStatus);

          // If it's a Notion error, provide more helpful message
          if (errorMessage.includes('Notion')) {
            const notionErrorStatus: JobStatus = {
              state: 'failed' as const,
              message: 'Failed to sync with Notion. Please ensure you have copied the Kindle Highlights template and granted necessary permissions.'
            };
            console.debug(`Job ${jobId} failed with Notion-specific error:`, notionErrorStatus);
            await setJobStatus(jobId, notionErrorStatus);
          }
        }
      }
    } catch (error) {
      console.error('Error polling for jobs:', error);
    }
  };

  // Start polling
  const interval = setInterval(pollJobs, POLLING_INTERVAL);

  // Handle shutdown
  process.on('SIGTERM', () => {
    console.log('Worker shutting down...');
    clearInterval(interval);
  });
}

// Start the worker
startWorker().catch(err => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});
