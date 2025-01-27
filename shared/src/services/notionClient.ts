import { Client, isFullPage } from '@notionhq/client';
import { createHash } from 'crypto';
import axios from 'axios';
import { NotionStore } from './notionStore';
import type { Highlight } from '../types/highlight';
import type { NotionToken } from '../types/notion';
import { withRetry } from '../utils/retry';
import { KVStore } from './kvStore';

// Make Highlight type available for external use
export type { Highlight };

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

interface NotionHighlight extends Required<Highlight> {
  version: number;
  lastModified: Date;
}

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

// Add version number when processing highlights for Notion
function addVersionToHighlight(highlight: Highlight): NotionHighlight {
  return {
    ...highlight,
    version: highlight.version ?? 1, // Default to version 1 if not specified
    lastModified: highlight.lastModified ?? new Date()
  };
}

export interface NotionBookPage {
  title: string;
  author: string;
  highlights: Highlight[];
  lastHighlighted: Date;
  lastSynced: Date;
}

// This function is only kept for backward compatibility with existing data
// New highlights should already come with their hash from parseClippings
function generateHighlightHash(highlight: string[], location: string, bookTitle: string, author: string): string {
  // Generate hash consistently with parseClippings.ts
  const firstChunk = highlight[0] || '';
  const content = firstChunk + location + bookTitle + author;
  // Generate full hash but return first 8 characters for Notion storage efficiency
  // while maintaining hash strength and allowing flexibility to use more chars if needed
  return createHash('sha256').update(content).digest('hex').slice(0, 8);
}

import { truncateHash } from '../utils/notionUtils.js';

function storeHashes(hashes: string[]): string {
  // Deduplicate and truncate hashes for Notion storage
  const uniqueHashes = Array.from(new Set(
    hashes.map(h => truncateHash(h))
  ));
  let hashString = '';

  for (const hash of uniqueHashes) {
    const newLength = hashString.length + hash.length + 1; // +1 for comma
    if (newLength > 2000) {
      console.warn('Truncating hash list at 2000 characters');
      break;
    }
    hashString += (hashString ? ',' : '') + hash;
  }

  console.debug('Stored hashes info:', {
    originalCount: hashes.length,
    uniqueCount: uniqueHashes.length,
    storedLength: hashString.length,
    sampleHashes: uniqueHashes.slice(0, 3)
  });
  
  return hashString;
}

// Client management with better initialization and storage
let _client: Client | null = null;
let _databaseId: string | null = null;
let _store: NotionStore | null = null;

export async function setOAuthToken(store: NotionStore, tokenData: NotionToken): Promise<void> {
  if (!store) {
    throw new Error('[OAuth] NotionStore is required');
  }

  try {
    console.log('[OAuth] Validating token data...', {
      hasWorkspaceId: !!tokenData?.workspace_id,
      hasAccessToken: !!tokenData?.access_token,
      hasOwner: !!tokenData?.owner,
      ownerType: tokenData?.owner?.type,
      hasUserId: !!tokenData?.owner?.user?.id
    });

    if (!tokenData?.workspace_id || !tokenData?.access_token) {
      throw new Error('Invalid token data - missing required fields');
    }

    const workspaceId = tokenData.workspace_id;
    const userId = tokenData.owner?.user?.id || '';

    console.log('[OAuth] Preparing to store token...', {
      workspaceId,
      userId,
      hasDatabaseId: !!_databaseId,
      hasStore: !!store,
      storeType: store.constructor.name
    });

    // Store the token data first
    console.log('[OAuth] Storing token data...');
    await store.setToken(tokenData);
    
    // Set global store reference
    console.log('[OAuth] Updating global store reference...');
    _store = store;

    // Only initialize client if it hasn't been initialized yet
    if (!_client) {
      console.log('[OAuth] Initializing Notion client...');
      _client = new Client({
        auth: tokenData.access_token,
      });
    }

    // Find the database
    console.log('[OAuth] Searching for Kindle Highlights database...');
    try {
      await findKindleHighlightsDatabase(_client);
    } catch (error) {
      console.error('[OAuth] Error finding database:', error);
      // Continue with token storage even if database search fails
    }

    // If we found the database ID, update it in store
    if (_databaseId) {
      console.log('[OAuth] Found database ID:', _databaseId);
      
      try {
        console.log('[OAuth] Storing database ID...');
        await store.setDatabaseId(workspaceId, _databaseId);
        console.log('[OAuth] Database ID storage updated');
      } catch (dbError) {
        console.error('[OAuth] Failed to store database ID:', dbError);
        // Don't throw here, as token is already stored
      }
    } else {
      console.log('[OAuth] No database ID found - continuing with token storage only');
    }

    console.log('[OAuth] OAuth flow completed successfully');
  } catch (error) {
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name
    };
    console.error('[OAuth] Failed to set OAuth token:', errorDetails);
    throw error;
  }
}

export async function getClient(): Promise<Client> {
  try {
    if (!_client && _store) {
      // Get workspace ID from environment or configuration
      const workspaceId = process.env.NOTION_WORKSPACE_ID;
      if (!workspaceId) {
        throw new Error('No workspace ID configured');
      }

      const token = await _store.getToken(workspaceId);
      if (!token) {
        throw new Error('No OAuth token available');
      }

      _client = new Client({
        auth: token.access_token,
      });

      // Also retrieve database ID if available
      _databaseId = await _store.getDatabaseId(workspaceId);
    }
    if (!_client) {
      throw new Error('Notion client not initialized and no store available');
    }
    return _client;
  } catch (error) {
    console.error('Failed to get Notion client:', error);
    throw error;
  }
}

export async function refreshToken(): Promise<void> {
  try {
    if (!_store) {
      throw new Error('No store available');
    }

    const workspaceId = process.env.NOTION_WORKSPACE_ID;
    if (!workspaceId) {
      throw new Error('No workspace ID configured');
    }

    const token = await _store.getToken(workspaceId);
    if (!token) {
      throw new Error('No token to refresh');
    }

    if (!token?.refresh_token) {
      console.log('No refresh token available - token may be from internal integration');
      return;
    }

    const response = await axios.post('https://api.notion.com/v1/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    }, {
      auth: {
        username: process.env.NOTION_OAUTH_CLIENT_ID!,
        password: process.env.NOTION_OAUTH_CLIENT_SECRET!,
      }
    });

    if (!response.data?.access_token) {
      throw new Error('Invalid refresh token response');
    }

    await setOAuthToken(_store, response.data);
  } catch (error) {
    console.error('Failed to refresh token:', error);
    throw error;
  }
}

export async function clearAuth(): Promise<void> {
  try {
    if (!_store) {
      throw new Error('No store available');
    }

    const workspaceId = process.env.NOTION_WORKSPACE_ID;
    if (workspaceId) {
      await _store.deleteToken(workspaceId);
    }

    _client = null;
    _databaseId = null;
  } catch (error) {
    console.error('Failed to clear auth:', error);
    throw error;
  }
}

async function findKindleHighlightsDatabase(client: Client) {
  if (!client) {
    throw new Error('Notion client not initialized');
  }
  
  try {
    console.debug('Searching for Kindle Highlights database...');
    // First try to find database using search
    const response = await client.search({
      query: 'Highlights',
      page_size: 100,
      // Per Notion API v2023-09-01, use this filter syntax
      filter: { value: 'database', property: 'object' }
    });

    console.debug('Search results:', {
      resultCount: response.results.length,
      hasMore: response.has_more,
      nextCursor: response.next_cursor
    });

    let searchResults = response;
    if (response.results.length === 0) {
      // If no results with query, try without query
      console.debug('No results found, trying without query...');
      searchResults = await client.search({
        filter: {
          property: 'object',
          value: 'database'
        },
        page_size: 100
      });
      console.debug('Fallback search results:', {
        resultCount: searchResults.results.length
      });
    }
    
    for (const result of searchResults.results) {
      if (result.object !== 'database') {
        console.debug('Skipping non-database result:', result.object);
        continue;
      }
      
      try {
        console.debug('Checking database:', result.id);
        const db = await client.databases.retrieve({ database_id: result.id });
        const props = db.properties;
        
        const requiredProps = {
          'Title': 'title',
          'Author': 'rich_text',
          'Highlights': 'number',
          'Last Highlighted': 'date',
          'Last Synced': 'date',
          'Highlight Hash': 'rich_text'
        };

        const missingProps = Object.entries(requiredProps)
          .filter(([name, type]) => props[name]?.type !== type)
          .map(([name, type]) => ({
            name,
            expectedType: type,
            actualType: props[name]?.type || 'missing'
          }));

        console.debug('Database property check:', {
          databaseId: result.id,
          hasAllProps: missingProps.length === 0,
          missingProps
        });

        if (missingProps.length === 0) {
          _databaseId = result.id;
          console.debug('Found matching database:', result.id);
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
    
    // Type check for rich_text property
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

export interface NotionClientConfig {
  store: NotionStore;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class NotionClient {
  private store: NotionStore;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(config: NotionClientConfig) {
    this.store = config.store;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    _store = config.store; // Set the global store reference
  }

  async exchangeCodeForToken(code: string): Promise<NotionToken> {
    if (!code) {
      throw new Error('No authorization code provided');
    }

    console.log('[NotionClient] Exchanging code for token...', {
      hasCode: !!code,
      redirectUri: this.redirectUri,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret
    });

    try {
      const response = await axios.post('https://api.notion.com/v1/oauth/token', {
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.redirectUri
      }, {
        auth: {
          username: this.clientId,
          password: this.clientSecret
        }
      });

      console.log('[NotionClient] Received OAuth response:', {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });

      // Full response logging for debugging
      console.log('[NotionClient] Full OAuth response:', JSON.stringify(response.data, null, 2));

      // Validate required fields
      const tokenData = response.data;
      const requiredFields = [
        'access_token',
        'workspace_id',
        'bot_id',
        'workspace_name',
        ['owner', 'type']
      ];

      for (const field of requiredFields) {
        if (Array.isArray(field)) {
          const [parent, child] = field;
          if (!tokenData?.[parent]?.[child]) {
            throw new Error(`Missing ${parent}.${child} in response`);
          }
        } else if (!tokenData?.[field]) {
          throw new Error(`Missing ${field} in response`);
        }
      }

      const token: NotionToken = {
        access_token: tokenData.access_token,
        token_type: 'bearer',
        bot_id: tokenData.bot_id,
        workspace_name: tokenData.workspace_name,
        workspace_icon: tokenData.workspace_icon || null,
        workspace_id: tokenData.workspace_id,
        owner: {
          type: tokenData.owner.type,
          workspace: tokenData.owner.workspace,
          user: tokenData.owner.user
        },
        duplicated_template_id: tokenData.duplicated_template_id || null,
        request_id: tokenData.request_id,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in
      };

      console.log('[NotionClient] Constructed token object:', {
        hasAccessToken: !!token.access_token,
        workspaceId: token.workspace_id,
        workspaceName: token.workspace_name,
        ownerType: token.owner.type
      });

      console.log('[NotionClient] Processing token...');
      
      // Set store and store token first
      console.log('[NotionClient] Storing token...');
      _store = this.store;
      await this.store.setToken(token);
      console.log('[NotionClient] Token stored successfully');
      
      // Then initialize client
      console.log('[NotionClient] Initializing client...');
      _client = new Client({
        auth: token.access_token
      });
      
      // Search for database is required
      console.log('[NotionClient] Searching for database...');
      try {
        if (!_client) {
          throw new Error('Client not initialized');
        }
        await findKindleHighlightsDatabase(_client);
        if (!_databaseId) {
          throw new Error('Could not find Kindle Highlights database. Please ensure you have copied the template to your workspace.');
        }
        console.log('[NotionClient] Found database:', _databaseId);
        await this.store.setDatabaseId(token.workspace_id, _databaseId);
      } catch (error) {
        console.error('[NotionClient] Database search error:', error);
        // Database ID is required for sync to work
        throw error;
      }
      

      return token;
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  }

  async getToken(token: string): Promise<NotionToken> {
    if (!token) {
      throw new Error('Token is required');
    }

    try {
      console.log('[NotionClient] Retrieving token data...', { token });
      
      // Get token data from store
      const tokenData = await this.store.getToken(token);
      if (!tokenData) {
        throw new Error('Token not found');
      }

      // Validate token data
      if (!tokenData.access_token || !tokenData.workspace_id) {
        throw new Error('Invalid token data');
      }

      // Check if token is expired using expires_in (seconds until expiration)
      if (tokenData.expires_in) {
        // Calculate expiration time based on when we received the token
        const receivedAt = tokenData.received_at || Date.now();
        const expirationTime = receivedAt + tokenData.expires_in * 1000;
        if (Date.now() > expirationTime) {
          throw new Error('Token expired');
        }
      }

      return tokenData;
    } catch (error) {
      console.error('[NotionClient] Failed to get token:', error);
      throw error;
    }
  }

  async updateNotionDatabase(highlights: Highlight[], workspaceId: string, onProgress?: () => void): Promise<void> {
  try {
    const client = await getClient();
    
    // Ensure we have found the Kindle Highlights database
    if (!_databaseId) {
      console.log('Finding Kindle Highlights database...');
      await findKindleHighlightsDatabase(client);
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
                      .concat(book.highlights.map(h => {
                        const truncatedHash = h.hash.slice(0, 8);
                        console.debug('Adding new hash:', {
                          fullHash: h.hash,
                          truncatedHash,
                          location: h.location,
                          bookTitle: book.title
                        });
                        return truncatedHash;
                      }))
                      .filter((h, i, arr) => arr.indexOf(h) === i) // Remove duplicates
                      .join(','))
                      .substring(0, 1900) // Leave some buffer for Notion's limit
                  }
                }]
              }
            }
          });

          // Log existing hashes before filtering
          console.debug('Deduplication check:', {
            bookTitle: book.title,
            totalHighlights: book.highlights.length,
            existingHashCount: existingHashes.size,
            sampleExistingHashes: Array.from(existingHashes).slice(0, 5)
          });

          // Check for potential hash conflicts
          const hashConflicts = new Map<string, Array<{location: string}>>();
          book.highlights.forEach(h => {
            if (hashConflicts.has(h.hash)) {
              hashConflicts.get(h.hash)!.push({ location: h.location });
            } else {
              hashConflicts.set(h.hash, [{ location: h.location }]);
            }
          });

          // Log any hash conflicts within current batch
          hashConflicts.forEach((locations, hash) => {
            if (locations.length > 1) {
              console.warn('Hash conflict in current batch:', {
                hash,
                bookTitle: book.title,
                conflictCount: locations.length,
                locations
              });
            }
          });

          // Filter out duplicates and log results
          const newHighlights = book.highlights.filter(h => {
            // existingHashes already contains 8-char hashes, so truncate incoming hash to match
            const truncatedHash = h.hash.slice(0, 8);
            const isDuplicate = existingHashes.has(truncatedHash);
            if (isDuplicate) {
              console.debug('Found duplicate:', {
                fullHash: h.hash,
                truncatedHash,
                location: h.location,
                bookTitle: book.title
              });
            }
            if (isDuplicate) {
              console.debug('Skipping duplicate highlight:', {
                hash: h.hash,
                location: h.location,
                bookTitle: book.title
              });
            }
            return !isDuplicate;
          });

          console.debug('Deduplication results:', {
            bookTitle: book.title,
            originalCount: book.highlights.length,
            newCount: newHighlights.length,
            duplicatesSkipped: book.highlights.length - newHighlights.length
          });

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
                      book.highlights.map(h => {
                        // Use existing hash from parseClippings or generate new one, always truncate
                        const fullHash = h.hash || generateHighlightHash(h.highlight, h.location, h.bookTitle, h.author);
                        return fullHash.slice(0, 8);
                      })
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
}
