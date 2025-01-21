import { Client } from '@notionhq/client';
import axios from 'axios';

export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string;
  location: string;
  date: Date;
}

export interface NotionBookPage {
  title: string;
  author: string;
  highlights: Highlight[];
  lastHighlighted: Date;
  lastSynced: Date;
}

// Initialize Notion client
let notion: Client;
let oauthToken: {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_name: string;
  workspace_icon: string;
  workspace_id: string;
  owner: {
    type: string;
    user?: {
      object: string;
      id: string;
      name: string;
      avatar_url: string;
    };
  };
  expires_in: number;
  refresh_token: string;
} | null = null;

// Database ID is discovered after OAuth
let databaseId: string | null = null;

export function initializeNotionClient(accessToken?: string) {
  if (accessToken) {
    notion = new Client({
      auth: accessToken,
    });
    return;
  }

  if (oauthToken) {
    notion = new Client({
      auth: oauthToken.access_token,
    });
    return;
  }
}

export async function refreshOAuthToken() {
  if (!oauthToken?.refresh_token) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post('https://api.notion.com/v1/oauth/token', {
    grant_type: 'refresh_token',
    refresh_token: oauthToken.refresh_token,
    client_id: process.env.NOTION_OAUTH_CLIENT_ID,
    client_secret: process.env.NOTION_OAUTH_CLIENT_SECRET,
  });

  oauthToken = {
    ...oauthToken,
    ...response.data,
    expires_in: response.data.expires_in,
  };

  initializeNotionClient();
}

export async function findKindleHighlightsDatabase() {
  if (!notion) throw new Error('Notion client not initialized');
  
  const response = await notion.search({
    filter: {
      property: 'object',
      value: 'database'
    }
  });
  
  for (const result of response.results) {
    if (result.object !== 'database') continue;
    
    try {
      const db = await notion.databases.retrieve({ database_id: result.id });
      const props = db.properties;
      
      if (props.Title?.type === 'title' &&
          props.Author?.type === 'rich_text' &&
          props.Highlights?.type === 'number' &&
          props['Last Highlighted']?.type === 'date' &&
          props['Last Synced']?.type === 'date') {
        databaseId = result.id;
        break;
      }
    } catch (error) {
      console.error('Error checking database:', error);
    }
  }
  
  if (!databaseId) {
    throw new Error('Could not find a compatible Kindle Highlights database. Please ensure you have copied the template to your workspace.');
  }
}

export async function setOAuthToken(token: typeof oauthToken) {
  oauthToken = token;
  initializeNotionClient();
  await findKindleHighlightsDatabase();
}

export function getOAuthToken() {
  return oauthToken;
}

export function getNotionClient() {
  if (!notion) {
    throw new Error('Notion client not initialized');
  }
  return notion;
}

export async function updateNotionDatabase(
  highlights: Highlight[],
  onProgress?: () => void
): Promise<void> {
  try {
    // Group highlights by book
    const books = highlights.reduce((acc, highlight) => {
      if (!acc[highlight.bookTitle]) {
        acc[highlight.bookTitle] = {
          title: highlight.bookTitle,
          author: highlight.author,
          highlights: [],
          lastHighlighted: highlight.date,
          lastSynced: new Date()
        };
      }
      acc[highlight.bookTitle].highlights.push(highlight);
      
      // Update lastHighlighted if this highlight is newer
      if (highlight.date > acc[highlight.bookTitle].lastHighlighted) {
        acc[highlight.bookTitle].lastHighlighted = highlight.date;
      }
      
      return acc;
    }, {} as Record<string, NotionBookPage>);

    // Update or create pages for each book
    for (const book of Object.values(books)) {
      await updateOrCreateBookPage(book, onProgress);
    }
  } catch (error) {
    console.error('Error updating Notion database:', error);
    throw error;
  }
}

async function updateOrCreateBookPage(
  book: NotionBookPage,
  onProgress?: () => void
) {
  if (!databaseId) throw new Error('Database ID not found');
  
  try {
    // Check if page already exists
    const { results } = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Title',
        title: {
          equals: book.title
        }
      }
    });

    const existingPageId = results[0]?.id;
    let pageId: string;

    // Create or update the page
    if (existingPageId) {
      const updatedPage = await notion.pages.update({
        page_id: existingPageId,
        properties: {
          Title: {
            title: [{ text: { content: book.title } }]
          },
          Author: {
            rich_text: [{ text: { content: book.author } }]
          },
          Highlights: {
            number: book.highlights.length
          },
          'Last Highlighted': {
            date: { start: book.lastHighlighted.toISOString() }
          },
          'Last Synced': {
            date: { start: new Date().toISOString() }
          }
        }
      });
      pageId = updatedPage.id;
    } else {
      const newPage = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Title: {
            title: [{ text: { content: book.title } }]
          },
          Author: {
            rich_text: [{ text: { content: book.author } }]
          },
          Highlights: {
            number: book.highlights.length
          },
          'Last Highlighted': {
            date: { start: book.lastHighlighted.toISOString() }
          },
          'Last Synced': {
            date: { start: new Date().toISOString() }
          }
        }
      });
      pageId = newPage.id;
    }

    // Get existing highlights to check for duplicates
    const { results: existingBlocks } = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100
    });

    // Create a set of existing highlight texts for duplicate checking
    const existingHighlightLocations = new Set(
      existingBlocks
        .filter(block => 'type' in block && block.type === 'paragraph' && 'paragraph' in block)
        .map(block => {
          const text = (block as any).paragraph?.rich_text?.[0]?.text?.content || '';
          const locationMatch = text.match(/📍 Location: ([\d-]+)/);
          return locationMatch ? locationMatch[1] : '';
        })
        .filter(Boolean)
    );

    // Add only new highlights, preserving existing ones
    const processedHighlights = new Set();
    for (const highlight of book.highlights) {
      // Skip if this highlight already exists
      if (processedHighlights.has(highlight.location) || 
          existingHighlightLocations.has(highlight.location)) {
        onProgress?.();
        continue;
      }
      
      processedHighlights.add(highlight.location);
      
      // Check if this is a new highlight for an existing book
      const isNewHighlight = existingPageId && 
        !existingHighlightLocations.has(highlight.location);

      await notion.blocks.children.append({
        block_id: pageId,
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: highlight.highlight
                  }
                },
                {
                  type: 'text',
                  text: {
                    content: `\n📍 Location: ${highlight.location} | 📅 Added: ${highlight.date.toLocaleString()}`
                  },
                  annotations: {
                    color: 'gray'
                  }
                }
              ]
            }
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error updating Notion page:', error);
    throw error;
  }
}
