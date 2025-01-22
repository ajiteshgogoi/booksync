import { Client } from '@notionhq/client';
import axios from 'axios';
import {
  getRedis,
  storeOAuthToken,
  getOAuthToken as getRedisOAuthToken,
  refreshOAuthToken as refreshRedisOAuthToken,
  deleteOAuthToken as deleteRedisOAuthToken
} from './redisService';

async function getBookCoverUrl(title: string, author: string): Promise<string | null> {
  try {
    // First try OpenLibrary
    const openLibraryResponse = await axios.get(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}+${encodeURIComponent(author)}&limit=1`
    );
    
    if (openLibraryResponse.data?.docs?.[0]?.cover_i) {
      return `https://covers.openlibrary.org/b/id/${openLibraryResponse.data.docs[0].cover_i}-L.jpg`;
    }

    // Fallback to Google Books
    const googleResponse = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=1`
    );
    
    if (googleResponse.data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
      return googleResponse.data.items[0].volumeInfo.imageLinks.thumbnail.replace(
        'zoom=1',
        'zoom=2'
      );
    }

    return null;
  } catch (error) {
    console.error('Error fetching book cover:', error);
    return null;
  }
}

export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string[];
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

  const newToken = {
    ...oauthToken,
    ...response.data,
    expires_in: response.data.expires_in,
  };

  await refreshRedisOAuthToken(JSON.stringify(newToken), newToken.workspace_id);
  oauthToken = newToken;
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

export async function createOAuthToken(code: string) {
  console.debug('Creating OAuth token with code:', code);
  try {
    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI,
      client_id: process.env.NOTION_OAUTH_CLIENT_ID,
      client_secret: process.env.NOTION_OAUTH_CLIENT_SECRET,
    });
    console.debug('Received OAuth token response:', response.data);

    const token = response.data;
    
    // Validate token structure
    if (!token?.access_token || 
        !token?.refresh_token ||
        !token?.workspace_id) {
      throw new Error('Invalid token structure from Notion');
    }

    const redis = await getRedis();
    console.debug('Storing OAuth token in Redis for workspace:', token.workspace_id);
    // Store token in Redis with 1 hour less than expiry to allow for refresh
    // Ensure expiration time is at least 1 second
    const expiration = Math.max(token.expires_in - 3600, 1);
    await redis.set(
      `oauth:${token.workspace_id}`,
      JSON.stringify(token),
      'EX', expiration
    );
    console.debug('OAuth token stored successfully');
    
    oauthToken = token;
    initializeNotionClient();
    await findKindleHighlightsDatabase();
    
    return token;
  } catch (error) {
    console.error('Error creating OAuth token:', error);
    throw error;
  }
}

export async function setOAuthToken(token: typeof oauthToken) {
  if (!token ||
      typeof token !== 'object' ||
      !token.access_token ||
      !token.token_type ||
      !token.bot_id ||
      !token.workspace_id) {
    throw new Error('Invalid OAuth token provided - missing required fields');
  }
  
  // Set default expires_in if not provided
  if (!token.expires_in) {
    token.expires_in = 3600; // 1 hour default
  }
  
  // Ensure refresh_token exists (it's optional in Notion's response)
  if (!token.refresh_token) {
    token.refresh_token = '';
  }

  await storeOAuthToken(JSON.stringify(token), token.workspace_id);
  oauthToken = token;
  initializeNotionClient();
  await findKindleHighlightsDatabase();
}

export async function getOAuthToken() {
  if (oauthToken) return oauthToken;
  
  try {
    const token = await getRedisOAuthToken();
    if (!token) {
      return null;
    }

    const parsedToken = JSON.parse(token);
    
    // Validate token structure
    if (!parsedToken?.access_token ||
        !parsedToken?.refresh_token ||
        !parsedToken?.workspace_id) {
      console.error('Invalid token structure:', parsedToken);
      return null;
    }

    oauthToken = parsedToken;
    initializeNotionClient();
    return oauthToken;
  } catch (error) {
    console.error('Error getting OAuth token:', error);
    return null;
  }
}

export function getNotionClient() {
  if (!notion) {
    throw new Error('Notion client not initialized');
  }
  return notion;
}

export async function clearAuth() {
  await deleteRedisOAuthToken();
  oauthToken = null;
  databaseId = null;
  notion = null as unknown as Client;
}

export async function updateNotionDatabase(
  highlights: Highlight[],
  onProgress?: () => void
): Promise<void> {
  try {
    // First ensure we have a valid token
    const token = await getOAuthToken();
    if (!token || !token.access_token) {
      throw new Error('No valid OAuth token found');
    }

    // Initialize Notion client if needed
    if (!notion) {
      initializeNotionClient(token.access_token);
    }

    // Ensure we have found the Kindle Highlights database
    if (!databaseId) {
      console.log('Finding Kindle Highlights database...');
      await findKindleHighlightsDatabase();
      if (!databaseId) {
        throw new Error('Could not find Kindle Highlights database. Please ensure you have copied the template to your workspace.');
      }
      console.log('Found Kindle Highlights database:', databaseId);
    }

    // Group highlights by book
    const books = highlights.reduce<Record<string, NotionBookPage>>((acc, highlight) => {
      // Ensure highlight.date is a Date object
      const highlightDate = highlight.date instanceof Date ? highlight.date : new Date(highlight.date);
      
      if (!acc[highlight.bookTitle]) {
        acc[highlight.bookTitle] = {
          title: highlight.bookTitle,
          author: highlight.author,
          highlights: [],
          lastHighlighted: highlightDate,
          lastSynced: new Date()
        };
      }

      // Create a new highlight object with the proper Date
      const processedHighlight = {
        ...highlight,
        date: highlightDate
      };
      acc[highlight.bookTitle].highlights.push(processedHighlight);
      
      // Update lastHighlighted if this highlight is newer
      if (highlightDate > acc[highlight.bookTitle].lastHighlighted) {
        acc[highlight.bookTitle].lastHighlighted = highlightDate;
      }
      
      return acc;
    }, {} as Record<string, NotionBookPage>);

    // Ensure we have a valid databaseId
    if (!databaseId) {
      throw new Error('Database ID not found');
    }

    // Update or create pages for each book
    for (const book of Object.values(books)) {
      await updateOrCreateBookPage(databaseId, book, onProgress);
    }
  } catch (error) {
    console.error('Error updating Notion database:', error);
    throw error;
  }
}

async function updateOrCreateBookPage(
  databaseId: string,
  book: NotionBookPage,
  onProgress?: () => void
) {
  if (!databaseId) throw new Error('Database ID not found');
  
  try {
    // Check if page already exists
    let existingPageId: string | undefined;
    const { results } = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Title',
        title: {
          equals: book.title
        }
      }
    });

    if (results.length > 0) {
      existingPageId = results[0].id;
    }

    // Update lastHighlighted to be the newest highlight date
    const newestHighlightDate = book.highlights.reduce((newest, highlight) => {
      const highlightDate = highlight.date instanceof Date ? highlight.date : new Date(highlight.date);
      return highlightDate > newest ? highlightDate : newest;
    }, new Date(0));
    
    book.lastHighlighted = newestHighlightDate;

    // Create or update the page (without updating last sync date yet)
    let pageId: string;
    if (existingPageId) {
      const coverUrl = await getBookCoverUrl(book.title, book.author);
      
      const updatedPage = await notion.pages.update({
        page_id: existingPageId,
        icon: coverUrl ? {
          type: 'external',
          external: {
            url: coverUrl
          }
        } : undefined,
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
          }
        }
      });
      pageId = updatedPage.id;
    } else {
      const coverUrl = await getBookCoverUrl(book.title, book.author);
      
      const newPage = await notion.pages.create({
        parent: { database_id: databaseId },
        icon: coverUrl ? {
          type: 'external',
          external: {
            url: coverUrl
          }
        } : undefined,
        properties: {
          Title: {
            type: 'title',
            title: [{ type: 'text', text: { content: book.title } }]
          },
          Author: {
            type: 'rich_text',
            rich_text: [{ type: 'text', text: { content: book.author } }]
          },
          Highlights: {
            type: 'number',
            number: book.highlights.length
          },
          'Last Highlighted': {
            type: 'date',
            date: { start: book.lastHighlighted.toISOString() }
          },
          'Last Synced': {
            type: 'date',
            date: { start: new Date().toISOString() }
          }
        }
      });
      pageId = newPage.id;
    }

    let addedCount = 0;
    
    try {
      for (const highlight of book.highlights) {
        try {
          // Update progress for every highlight processed
          onProgress?.();

          // Helper function to split text at sentence boundaries
          const splitAtSentences = (text: string, maxLength: number): string[] => {
            const sentences = text.split(/(?<=[.!?])\s+/);
            const chunks: string[] = [];
            let currentChunk = '';
            
            for (const sentence of sentences) {
              if ((currentChunk + sentence).length <= maxLength) {
                currentChunk += (currentChunk ? ' ' : '') + sentence;
              } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
              }
            }
            
            if (currentChunk) chunks.push(currentChunk);
            return chunks;
          };

          // Split highlight into chunks of <= 2000 characters at sentence boundaries
          const highlightText = highlight.highlight.join('\n\n');
          const chunks = splitAtSentences(highlightText, 2000);
          
          // Create blocks for each chunk
          const blocks = chunks.map((chunk, index) => ({
            object: 'block' as const,
            type: 'paragraph' as const,
            paragraph: {
              rich_text: [
                {
                  type: 'text' as const,
                  text: {
                    content: chunk
                  }
                },
                ...(index === chunks.length - 1 ? [{
                  type: 'text' as const,
                  text: {
                    content: `\n📍 Location: ${highlight.location} | 📅 Added: ${(highlight.date instanceof Date ? highlight.date : new Date(highlight.date)).toLocaleString()}`
                  },
                  annotations: {
                    color: 'gray' as const
                  }
                }] : [])
              ]
            }
          }));

          const result = await notion.blocks.children.append({
            block_id: pageId,
            children: blocks
          });

          if (!result || !result.results || result.results.length === 0) {
            console.error('Failed to append highlight blocks:', highlight.location);
            continue;
          }

          if (result && result.results && result.results.length > 0) {
            addedCount++;
          }
        } catch (error) {
          console.error('Error processing highlight:', highlight.location, error);
        }
      }

      console.log(`Added ${addedCount} highlights for "${book.title}"`);
    } catch (error) {
      console.error('Error processing highlights:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating Notion page:', error);
    throw error;
  }
}
