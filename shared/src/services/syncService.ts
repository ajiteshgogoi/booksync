import { Highlight } from '../types/highlight';
import { NotionClient } from './notionClient';
import { getBookHighlightHashes, truncateHash } from '../utils/notionUtils';
import { parseClippings } from '../utils/parseClippings';

// Sync service configuration
export interface SyncConfig {
  batchSize?: number;
  batchDelay?: number;
  maxRetries?: number;
  maxHighlightsPerRun?: number;
  onProgress?: (progress: number, message: string) => Promise<void>;
}

const DEFAULT_CONFIG: Required<SyncConfig> = {
  batchSize: 10,
  batchDelay: 200,
  maxRetries: 3,
  maxHighlightsPerRun: 1000,
  onProgress: async () => {}
};

export class SyncService {
  private config: Required<SyncConfig>;
  private notionClient: NotionClient;

  constructor(notionClient: NotionClient, config: SyncConfig = {}) {
    this.notionClient = notionClient;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async deduplicateHighlights(
      highlights: Highlight[],
      workspaceId: string,
    ): Promise<Highlight[]> {
      // Group highlights by book title for batch processing
      const bookHighlights = new Map<string, Highlight[]>();
      for (const highlight of highlights) {
        if (!bookHighlights.has(highlight.bookTitle)) {
          bookHighlights.set(highlight.bookTitle, []);
        }
        bookHighlights.get(highlight.bookTitle)!.push(highlight);
      }
  
      // Check for duplicates and filter them out
      const uniqueHighlights: Highlight[] = [];
      for (const [bookTitle, bookHighlightList] of bookHighlights.entries()) {
        // Convert each highlight's hash to truncated form
        const newHighlightHashes = new Set(
          bookHighlightList.map(h => truncateHash(h.hash))
        );
  
        // Add all highlights for new books
        uniqueHighlights.push(...bookHighlightList);
      }
  
      return uniqueHighlights;
    }

  async processHighlights(
    highlights: Highlight[],
    databaseId: string
  ): Promise<void> {
    const total = highlights.length;
    if (total === 0) return;

    // Process highlights in batches
    for (let i = 0; i < highlights.length; i += this.config.batchSize) {
      const batch = highlights.slice(i, Math.min(i + this.config.batchSize, highlights.length));
      let retryCount = 0;

      while (retryCount < this.config.maxRetries) {
        try {
          await this.notionClient.updateNotionDatabase(batch, databaseId);
          
          // Calculate and report progress
          const processed = i + batch.length;
          const progress = Math.round((processed / total) * 100);
          await this.config.onProgress(
            progress,
            `Processing ${processed}/${total} highlights`
          );
          
          break; // Success, move to next batch
        } catch (error) {
          retryCount++;
          if (retryCount === this.config.maxRetries) {
            throw error;
          }
          // Exponential backoff
          await new Promise(resolve => 
            setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000))
          );
        }
      }

      // Add delay between batches
      await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
    }
  }

  async parseAndValidateContent(fileContent: string): Promise<Highlight[]> {
    const highlights = await parseClippings(fileContent);
    if (highlights.length === 0) {
      throw new Error('No highlights found in file');
    }
    return highlights;
  }
}