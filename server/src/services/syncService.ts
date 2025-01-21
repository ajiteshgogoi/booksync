import { parseClippings } from '../utils/parseClippings';
import { updateNotionDatabase } from './notionClient';

export async function syncHighlights(
  fileContent: string,
  onProgress?: (count: number) => void
): Promise<void> {
  try {
    // Parse the clippings file
    const highlights = parseClippings(fileContent);
    let syncedCount = 0;
    
    // Update Notion database with parsed highlights
    await updateNotionDatabase(highlights, () => {
      syncedCount++;
      onProgress?.(syncedCount);
    });
  } catch (error) {
    console.error('Error syncing highlights:', error);
    throw error;
  }
}
