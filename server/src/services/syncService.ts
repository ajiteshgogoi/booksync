import { parseClippings } from '../utils/parseClippings';
import { updateNotionDatabase } from './notionClient';
import { 
  cacheHighlight,
  isHighlightCached,
  checkRateLimit
} from './redisService';

// Configuration
const BATCH_SIZE = 10; // Number of highlights per batch
const BATCH_DELAY = 1000; // 1 second delay between batches

export async function syncHighlights(
  fileContent: string,
  onProgress?: (count: number) => void
): Promise<void> {
  try {
    // Parse the clippings file
    const highlights = parseClippings(fileContent);//
    let syncedCount = 0;
    
    // Process highlights in batches
    for (let i = 0; i < highlights.length; i += BATCH_SIZE) {
      // Check rate limit before each batch
      if (!await checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }

      const batch = highlights.slice(i, i + BATCH_SIZE);
      
      // Filter out already cached highlights
      const highlightsToSync = [];
      for (const highlight of batch) {
        if (!await isHighlightCached(highlight.bookTitle, highlight)) {
          highlightsToSync.push(highlight);
        }
      }

      // Sync the batch if there are new highlights
      if (highlightsToSync.length > 0) {
        await updateNotionDatabase(highlightsToSync);
        
        // Cache the synced highlights
        for (const highlight of highlightsToSync) {
          await cacheHighlight(highlight.bookTitle, highlight);
          syncedCount++;
          onProgress?.(syncedCount);
        }
      }

      // Add delay between batches to prevent timeouts
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  } catch (error) {
    console.error('Error syncing highlights:', error);
    throw error;
  }
}
