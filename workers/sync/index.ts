import { Redis } from '@upstash/redis';
import { Client as NotionClient } from '@notionhq/client';
import { parseClippings } from '../../server/src/utils/parseClippings.js';
import { getBookHighlightHashes, truncateHash } from '../../server/src/utils/notionUtils.js';
import type { Highlight } from '../../server/src/types/highlight.js';

interface Env {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  NOTION_OAUTH_CLIENT_ID: string;
  NOTION_OAUTH_CLIENT_SECRET: string;
  NOTION_REDIRECT_URI: string;
  NOTION_TOKEN: string;
}

interface JobStatus {
  state: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  total?: number;
  lastProcessedIndex?: number;
  userId?: string;
}

interface ProcessedHighlight extends Highlight {
  databaseId: string;
}

type RedisStreamEntry = [string, string[]]; // [messageId, [key1, value1, key2, value2, ...]]

interface JobMessage {
  jobId: string;
  userId: string;
  type: string;
}

class SyncWorker {
  private redis: Redis;
  private notionClient: NotionClient;

  constructor(private env: Env) {
    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    this.notionClient = new NotionClient({
      auth: env.NOTION_TOKEN
    });
  }

  private async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const status = await this.redis.get<JobStatus>(`job:${jobId}`);
    return status;
  }

  private async setJobStatus(jobId: string, status: Partial<JobStatus>): Promise<void> {
    const currentStatus = await this.getJobStatus(jobId) || {
      state: 'pending',
      progress: 0,
      message: '',
      total: 0,
      lastProcessedIndex: 0
    };
    
    await this.redis.set(`job:${jobId}`, {
      ...currentStatus,
      ...status
    });
  }

  private parseStreamEntry(entry: RedisStreamEntry): JobMessage {
    const [_, fields] = entry;
    const data: Record<string, string> = {};
    
    // Parse key-value pairs from Redis stream format
    for (let i = 0; i < fields.length; i += 2) {
      data[fields[i]] = fields[i + 1];
    }
    
    return {
      jobId: data.jobId || '',
      userId: data.userId || '',
      type: data.type || ''
    };
  }

  private async processHighlights(jobId: string): Promise<void> {
    const MAX_HIGHLIGHTS = 50; // Process 50 highlights per batch
    const MIN_BATCH_DELAY = 500; // 500ms between batches

    try {
      // Get all highlights for this job
      const pattern = `highlights:${jobId}:*`;
      const keys = await this.redis.keys(pattern);
      const highlights: ProcessedHighlight[] = [];
      
      // Fetch highlights in parallel for better performance
      const highlightPromises = keys.map(key => this.redis.get<ProcessedHighlight>(key));
      const highlightResults = await Promise.all(highlightPromises);
      highlights.push(...highlightResults.filter((h): h is ProcessedHighlight => h !== null));

      const total = highlights.length;
      if (total === 0) {
        await this.setJobStatus(jobId, {
          state: 'completed',
          progress: 100,
          message: 'No highlights to process'
        });
        return;
      }

      // Process highlights in batches
      for (let i = 0; i < highlights.length; i += MAX_HIGHLIGHTS) {
        const batch = highlights.slice(i, i + MAX_HIGHLIGHTS);
        
        try {
          // Update Notion database
          const databaseId = batch[0].databaseId;
          if (!databaseId) throw new Error('Database ID not found');

          // Check for duplicates
          const bookHighlights = new Map<string, ProcessedHighlight[]>();
          batch.forEach(h => {
            if (!bookHighlights.has(h.bookTitle)) {
              bookHighlights.set(h.bookTitle, []);
            }
            bookHighlights.get(h.bookTitle)!.push(h);
          });

          // Process each book's highlights
          for (const [bookTitle, bookHighlightList] of bookHighlights.entries()) {
            const existingHashes = await getBookHighlightHashes(this.notionClient, databaseId, bookTitle);
            
            // Filter out duplicates
            const newHighlights = bookHighlightList.filter(h => {
              const truncatedHash = truncateHash(h.hash);
              return !existingHashes.has(truncatedHash);
            });

            if (newHighlights.length > 0) {
              // Add highlights to Notion
              await Promise.all(newHighlights.map(highlight => 
                this.notionClient.pages.create({
                  parent: { database_id: databaseId },
                  properties: {
                    'Book Title': { title: [{ text: { content: highlight.bookTitle } }] },
                    'Author': { rich_text: [{ text: { content: highlight.author } }] },
                    'Highlight': { rich_text: highlight.highlight.map(h => ({ text: { content: h } })) },
                    'Location': { rich_text: [{ text: { content: highlight.location } }] },
                    'Date': { date: { start: highlight.date.toISOString() } },
                    'Hash': { rich_text: [{ text: { content: truncateHash(highlight.hash) } }] }
                  }
                })
              ));
            }
          }

          // Update progress
          const progress = Math.round(((i + batch.length) / total) * 100);
          await this.setJobStatus(jobId, {
            state: 'processing',
            progress,
            message: `Processing highlights: ${i + batch.length}/${total}`
          });

          // Clean up processed highlights
          await Promise.all(
            batch.map((_, index) => 
              this.redis.del(`highlights:${jobId}:${i + index}`)
            )
          );

          // Add delay between batches
          await new Promise(resolve => setTimeout(resolve, MIN_BATCH_DELAY));

        } catch (error) {
          console.error('Batch processing error:', error);
          throw error;
        }
      }

      // Mark job as completed
      await this.setJobStatus(jobId, {
        state: 'completed',
        progress: 100,
        message: 'Successfully processed all highlights'
      });

    } catch (error) {
      console.error('Job processing error:', error);
      await this.setJobStatus(jobId, {
        state: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  }

  async processPendingJobs(): Promise<void> {
    try {
      // Get pending jobs from Redis stream
      const result = await this.redis.xrange('kindle:jobs', '-', '+');
      
      if (!Array.isArray(result) || result.length === 0) {
        console.log('No pending jobs found');
        return;
      }

      // Process only up to 10 jobs at a time
      const entries = result.slice(0, 10) as RedisStreamEntry[];

      for (const entry of entries) {
        const { jobId } = this.parseStreamEntry(entry);
        
        try {
          // Process the job
          await this.processHighlights(jobId);
          
          // Acknowledge the message
          await this.redis.xdel('kindle:jobs', entry[0]); // entry[0] is the message ID

        } catch (error) {
          console.error('Error processing job:', { jobId, error });
        }
      }
    } catch (error) {
      console.error('Error checking pending jobs:', error);
    }
  }
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const worker = new SyncWorker(env);
    await worker.processPendingJobs();
  }
};