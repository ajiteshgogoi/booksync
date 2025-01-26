import { Client, isFullPage } from '@notionhq/client';

// Function to truncate hash for Notion storage
export function truncateHash(hash: string): string {
  return hash.slice(0, 8);
}

// Get existing highlight hashes from a Notion page
export async function getExistingHighlightHashes(
  client: Client,
  pageId: string
): Promise<Set<string>> {
  try {
    const page = await client.pages.retrieve({ page_id: pageId });
    
    if (!isFullPage(page)) {
      return new Set();
    }

    const hashProperty = page.properties['Highlight Hash'];
    
    if (hashProperty?.type !== 'rich_text') {
      console.debug('Hash property is not rich_text type', {
        pageId,
        actualType: hashProperty?.type
      });
      return new Set();
    }

    const richTextProperty = hashProperty as {
      type: 'rich_text';
      rich_text: Array<{
        type: string;
        text?: { content: string };
        plain_text?: string;
      }>;
    };

    // Log the raw hash property for debugging
    console.debug('Retrieved hash property:', {
      pageId,
      propertyType: richTextProperty.type,
      hasRichText: Array.isArray(richTextProperty.rich_text),
      firstTextType: richTextProperty.rich_text[0]?.type,
      rawContent: richTextProperty.rich_text[0]?.plain_text
    });

    if (richTextProperty.rich_text[0]?.type === 'text' &&
        richTextProperty.rich_text[0].plain_text) {
      const hashString = hashProperty.rich_text[0].plain_text;
      // Hashes in Notion are already truncated, just split and filter empty
      const hashes = new Set(hashString.split(',').filter(h => h.trim()));
      
      console.debug('Parsed existing hashes:', {
        pageId,
        hashCount: hashes.size,
        sampleHashes: Array.from(hashes).slice(0, 5),
        totalHashString: hashString.length,
        hashStringPreview: hashString.substring(0, 100) + '...'
      });
      
      return hashes;
    }
    
    console.debug('No existing hashes found', { pageId });
    return new Set();
  } catch (error) {
    console.error('Error getting existing highlight hashes:', error);
    throw error;
  }
}

// Get all existing hashes from a book's page in Notion
export async function getBookHighlightHashes(
  client: Client,
  databaseId: string,
  bookTitle: string
): Promise<Set<string>> {
  try {
    // Find the page for this book
    const { results } = await client.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Title',
        title: {
          equals: bookTitle
        }
      }
    });

    if (results.length === 0) {
      console.debug('No existing page found for book:', bookTitle);
      return new Set();
    }

    // Get existing hashes from the page
    return await getExistingHighlightHashes(client, results[0].id);
  } catch (error) {
    console.error('Error getting book highlight hashes:', error);
    throw error;
  }
}