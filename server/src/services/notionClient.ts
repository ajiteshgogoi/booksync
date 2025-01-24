import { Client, isFullPage } from '@notionhq/client';
import { createHash } from 'crypto';
import axios from 'axios';
import {
  getRedis,
  storeOAuthToken,
  getOAuthToken as getRedisOAuthToken,
  refreshOAuthToken as refreshRedisOAuthToken,
  deleteOAuthToken as deleteRedisOAuthToken
} from './redisService.js';
import type { NotionToken } from '../types.js';

// Define necessary types
type PageObjectResponse = {
  id: string;
  object: 'page';
  properties: {
    [key: string]: {
      type: string;
      id?: string;
      title?: Array<{ text: { content: string } }>;
      rich_text?: Array<{ text: { content: string } }>;
      number?: number;
      [key: string]: any;
    };
  };
};

import { withRetry } from '../utils/retry.js';

// Enhanced book cover fetching with retry mechanism
async function getBookCoverUrl(title: string, author: string): Promise<string | null> {
  try {
    // First try OpenLibrary with retry
    const openLibraryCover = await withRetry(async () => {
      const response = await axios.get(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(title)}+${encodeURIComponent(author)}&limit=1`
      );
      
      if (response.data?.docs?.[0]?.cover_i) {
        return `https://covers.openlibrary.org/b/id/${response.data.docs[0].cover_i}-L.jpg`;
      }
      return null;
    }, 3, 1000);

    if (openLibraryCover) {
      return openLibraryCover;
    }

    // Fallback to Google Books with retry
    return await withRetry(async () => {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}&maxResults=1`
      );
      
      if (response.data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
        return response.data.items[0].volumeInfo.imageLinks.thumbnail.replace('zoom=1', 'zoom=2');
      }
      return null;
    }, 3, 1000);

  } catch (error) {
    console.error('Error fetching book cover:', error);
    return null;
  }
}

// Enhanced types and interfaces
export interface Highlight {
  bookTitle: string;
  author: string;
  highlight: string[];
  location: string;
  date: Date;
  hash: string;
  version: number;
  lastModified?: Date;
}

export interface NotionBookPage {
  title: string;
  author: string;
  highlights: Highlight[];
  lastHighlighted: Date;
  lastSynced: Date;
}

function generateHighlightHash(highlight: string[], location: string, bookTitle: string, author: string, date: Date): string {
  const content = highlight.join('\n\n') + location + bookTitle + author + date.toISOString();
  // Use full SHA-256 hash encoded in base64 for better uniqueness and storage efficiency
  return createHash('sha256').update(content).digest('base64');
}

function storeHashes(hashes: string[]): string {
  // Deduplicate and limit to 2000 characters
  const uniqueHashes = Array.from(new Set(hashes));
  let hashString = '';
  
  for (const hash of uniqueHashes) {
    const newLength = hashString.length + hash.length + 1; // +1 for comma
    if (newLength > 2000) break;
    hashString += (hashString ? ',' : '') + hash;
  }
  
  return hashString;
}

// Client management with better initialization
let _client: Client | null = null;
let _databaseId: string | null = null;

export async function setOAuthToken(tokenData: NotionToken): Promise<void> {
  try {
    if (!tokenData?.workspace_id || !tokenData?.access_token) {
      throw new Error('Invalid token data - missing required fields');
    }

    const workspaceId = tokenData.workspace_id;
    const userId = tokenData.owner?.user?.id || '';

    // Log initial token storage
    console.log('[OAuth] Storing initial token data', {
      workspaceId,
      userId,
      hasDatabaseId: !!_databaseId
    });

    // Store the token data first
    await storeOAuthToken(
      JSON.stringify(tokenData),
      workspaceId,
      '', // Database ID will be set after we find it
      userId
    );

    console.log('[OAuth] Initial token storage complete');

    // Initialize client
    _client = new Client({
      auth: tokenData.access_token,
    });

    // Find the database
    console.log('[OAuth] Searching for Kindle Highlights database...');
    await findKindleHighlightsDatabase();

    // If we found the database ID, update the token storage with it
    if (_databaseId) {
      console.log('[OAuth] Found database ID:', _databaseId);
      console.log('[OAuth] Updating token storage with database ID');

      await storeOAuthToken(
        JSON.stringify(tokenData),
        workspaceId,
        _databaseId,
        userId
      );

      console.log('[OAuth] Token storage updated with database ID');
    } else {
      console.log('[OAuth] No database ID found - using initial token storage');
    }

    console.log('[OAuth] OAuth flow completed successfully');
  } catch (error) {
    console.error('[OAuth] Failed to set OAuth token:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

export async function getClient(): Promise<Client> {
  try {
    if (!_client) {
      const tokenData = await getRedisOAuthToken();
      if (!tokenData) {
        throw new Error('No OAuth token available');
      }
      
      try {
        const data = JSON.parse(tokenData);
        if (!data?.access_token) {
          throw new Error('Invalid token structure');
        }
        
        _client = new Client({
          auth: data.access_token,
        });
      } catch (parseError) {
        console.error('Invalid token structure:', tokenData);
        throw new Error('Failed to parse stored token');
      }
    }
    return _client;
  } catch (error) {
    console.error('Failed to get Notion client:', error);
    throw error;
  }
}

export async function refreshToken(): Promise<void> {
  try {
    const currentToken = await getRedisOAuthToken();
    if (!currentToken) {
      throw new Error('No token to refresh');
    }

    let tokenData: NotionToken;
    try {
      tokenData = JSON.parse(currentToken);
      if (!tokenData?.refresh_token) {
        console.log('No refresh token available - token may be from internal integration');
        return;
      }
    } catch (parseError) {
      console.error('Invalid token structure:', currentToken);
      throw new Error('Failed to parse stored token');
    }

    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
    }, {
      auth: {
        username: process.env.NOTION_OAUTH_CLIENT_ID!,
        password: process.env.NOTION_OAUTH_CLIENT_SECRET!,
      }
    });

    if (!response.data?.access_token) {
      throw new Error('Invalid refresh token response');
    }

    await setOAuthToken(response.data);
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    const token = await getRedisOAuthToken();
    if (token) {
      const tokenData = JSON.parse(token);
      await deleteRedisOAuthToken(tokenData.workspace_id);
    }
    _client = null;
    _databaseId = null;
  } catch (error) {
    console.error('Failed to clear auth:', error);
    throw error;
  }
}

async function findKindleHighlightsDatabase() {
  if (!_client) throw new Error('Notion client not initialized');
  
  try {
    const response = await _client.search({
      filter: {
        property: 'object',
        value: 'database'
      }
    });
    
    for (const result of response.results) {
      if (result.object !== 'database') continue;
      
      try {
        const db = await _client.databases.retrieve({ database_id: result.id });
        const props = db.properties;
        
        if (props.Title?.type === 'title' &&
            props.Author?.type === 'rich_text' &&
            props.Highlights?.type === 'number' &&
            props['Last Highlighted']?.type === 'date' &&
            props['Last Synced']?.type === 'date' &&
            props['Highlight Hash']?.type === 'rich_text') {
          _databaseId = result.id;
          break;
        }
      } catch (error) {
        console.error('Error checking database:', error);
      }
    }
    
    if (!_databaseId) {
      throw new Error('Could not find a compatible Kindle Highlights database. Please ensure you have copied the template to your workspace.');
    }
  } catch (error) {
    console.error('Error finding database:', error);
    throw error;
  }
}

async function getExistingHighlightHashes(pageId: string): Promise<Set<string>> {
  try {
    const client = await getClient();
    const page = await client.pages.retrieve({ page_id: pageId });
    
    if (!isFullPage(page)) {
      return new Set();
    }

    const hashProperty = page.properties['Highlight Hash'];
    
    if (hashProperty?.type === 'rich_text' &&
        Array.isArray(hashProperty.rich_text) &&
        hashProperty.rich_text[0]?.type === 'text' &&
        hashProperty.rich_text[0].plain_text) {
      const hashString = hashProperty.rich_text[0].plain_text;
      return new Set(hashString.split(',').filter(h => h.length === 8));
    }
    
    return new Set();
  } catch (error) {
    console.error('Error getting existing highlight hashes:', error);
    throw error;
  }
}

function splitAtSentences(text: string, maxLength: number): string[] {
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
}

export async function updateNotionDatabase(highlights: Highlight[], onProgress?: () => void): Promise<void> {
  try {
    const client = await getClient();
    
    // Ensure we have found the Kindle Highlights database
    if (!_databaseId) {
      console.log('Finding Kindle Highlights database...');
      await findKindleHighlightsDatabase();
      if (!_databaseId) {
        throw new Error('Could not find Kindle Highlights database. Please ensure you have copied the template to your workspace.');
      }
      console.log('Found Kindle Highlights database:', _databaseId);
    }

    // Group highlights by book with better error handling
    const books = highlights.reduce<Record<string, NotionBookPage>>((acc, highlight) => {
      try {
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

        acc[highlight.bookTitle].highlights.push({
          ...highlight,
          date: highlightDate
        });
        
        // Update lastHighlighted if this highlight is newer
        if (highlightDate > acc[highlight.bookTitle].lastHighlighted) {
          acc[highlight.bookTitle].lastHighlighted = highlightDate;
        }
      } catch (error) {
        console.error('Error processing highlight:', error);
      }
      
      return acc;
    }, {});

    // Process each book with better error recovery
    for (const book of Object.values(books)) {
      try {
        // Check if page already exists
        const { results } = await client.databases.query({
          database_id: _databaseId,
          filter: {
            property: 'Title',
            title: {
              equals: book.title
            }
          }
        });

        const existingPageId = results.length > 0 ? results[0].id : undefined;
        const existingHashes = existingPageId ? 
          await getExistingHighlightHashes(existingPageId) : 
          new Set<string>();

        // Get book cover with fallback
        const coverUrl = await getBookCoverUrl(book.title, book.author);

        if (existingPageId) {
          // Update existing page with better error handling
          const existingPage = await client.pages.retrieve({ page_id: existingPageId });
          let currentCount = 0;
          if (isFullPage(existingPage) && existingPage.properties.Highlights.type === 'number') {
            currentCount = existingPage.properties.Highlights.number || 0;
          }

          await client.pages.update({
            page_id: existingPageId,
            icon: coverUrl ? {
              type: 'external',
              external: { url: coverUrl }
            } : undefined,
            properties: {
              Title: {
                title: [{ text: { content: book.title } }]
              },
              Author: {
                rich_text: [{ text: { content: book.author } }]
              },
              Highlights: {
                number: currentCount + book.highlights.filter(h => !existingHashes.has(h.hash)).length
              },
              'Last Highlighted': {
                date: { start: book.lastHighlighted.toISOString() }
              },
              'Last Synced': {
                date: { start: new Date().toISOString() }
              },
              'Highlight Hash': {
                rich_text: [{
                  text: {
                    content: ((existingHashes.size > 0 ? [...existingHashes] : [])
                      .concat(book.highlights.map(h => h.hash))
                      .filter((h, i, arr) => arr.indexOf(h) === i) // Remove duplicates
                      .join(','))
                      .substring(0, 1900) // Leave some buffer for Notion's limit
                  }
                }]
              }
            }
          });

          // Add new highlights in batches with progress updates
          const newHighlights = book.highlights.filter(h => !existingHashes.has(h.hash));
          const batchSize = 100;

          for (let i = 0; i < newHighlights.length; i += batchSize) {
            onProgress?.();
            
            const batchHighlights = newHighlights.slice(i, i + batchSize);
            const blocks = batchHighlights.flatMap(highlight => {
              const highlightText = Array.isArray(highlight.highlight) ? 
                highlight.highlight.join('\n\n') : highlight.highlight;
              const chunks = splitAtSentences(highlightText, 2000);
              
              return [
                ...chunks.map((chunk, index) => ({
                  object: 'block' as const,
                  type: 'paragraph' as const,
                  paragraph: {
                    rich_text: [
                      {
                        type: 'text' as const,
                        text: { content: chunk }
                      },
                      ...(index === chunks.length - 1 ? [{
                        type: 'text' as const,
                        text: {
                          content: `\n📍 Location: ${highlight.location} | 📅 Added: ${highlight.date.toLocaleString()}`
                        },
                        annotations: {
                          color: 'gray' as const
                        }
                      }] : [])
                    ]
                  }
                })),
                {
                  object: 'block' as const,
                  type: 'paragraph' as const,
                  paragraph: {
                    rich_text: []
                  }
                }
              ];
            });

            if (blocks.length > 0) {
              await client.blocks.children.append({
                block_id: existingPageId,
                children: blocks
              });
            }
          }
        } else {
          // Create new page with better error handling
          const newPage = await client.pages.create({
            parent: { database_id: _databaseId },
            icon: coverUrl ? {
              type: 'external',
              external: { url: coverUrl }
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
              },
              'Last Synced': {
                date: { start: new Date().toISOString() }
              },
              'Highlight Hash': {
                rich_text: [{
                  text: {
                    content: storeHashes(
                      book.highlights.map(h =>
                        generateHighlightHash(h.highlight, h.location, book.title, book.author, h.date)
                      )
                    )
                  }
                }]
              }
            }
          });

          // Add highlights to new page
          const blocks = book.highlights.flatMap(highlight => {
            const highlightText = Array.isArray(highlight.highlight) ? 
              highlight.highlight.join('\n\n') : highlight.highlight;
            const chunks = splitAtSentences(highlightText, 2000);
            
            return [
              ...chunks.map((chunk, index) => ({
                object: 'block' as const,
                type: 'paragraph' as const,
                paragraph: {
                  rich_text: [
                    {
                      type: 'text' as const,
                      text: { content: chunk }
                    },
                    ...(index === chunks.length - 1 ? [{
                      type: 'text' as const,
                      text: {
                        content: `\n📍 Location: ${highlight.location} | 📅 Added: ${highlight.date.toLocaleString()}`
                      },
                      annotations: {
                        color: 'gray' as const
                      }
                    }] : [])
                  ]
                }
              })),
              {
                object: 'block' as const,
                type: 'paragraph' as const,
                paragraph: {
                  rich_text: []
                }
              }
            ];
          });

          if (blocks.length > 0) {
            await client.blocks.children.append({
              block_id: newPage.id,
              children: blocks
            });
          }
        }
      } catch (error) {
        console.error('Error processing book:', book.title, error);
      }
    }
  } catch (error) {
    console.error('Error updating Notion database:', error);
    throw error;
  }
}
