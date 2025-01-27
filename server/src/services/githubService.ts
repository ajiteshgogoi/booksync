import axios from 'axios';
import { getUploadUrl, downloadObject } from './r2Service.js';

const TOKEN_PREFIX = 'tokens/oauth/';

async function getTokenData(retryCount = 0): Promise<{ userId: string; databaseId: string }> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  try {
    // Get token from R2 storage
    const tokenKey = `${TOKEN_PREFIX}notion_token.json`; // Using a fixed path since we only support one user for now
    const tokenData = await downloadObject(tokenKey);
    const tokenDataObj = JSON.parse(tokenData.toString());
    
    if (!tokenDataObj.userId || typeof tokenDataObj.userId !== 'string') {
      throw new Error(`Invalid user ID format: ${tokenDataObj.userId}`);
    }

    if (!tokenDataObj.databaseId || typeof tokenDataObj.databaseId !== 'string') {
      throw new Error(`Invalid database ID format: ${tokenDataObj.databaseId}`);
    }

    console.log('Successfully retrieved user ID and database ID from R2 token');
    return {
      userId: tokenDataObj.userId,
      databaseId: tokenDataObj.databaseId
    };
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Retry ${retryCount + 1}/${MAX_RETRIES}: Failed to get token data, retrying...`, error);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryCount)));
      return getTokenData(retryCount + 1);
    }
    throw error;
  }
}

export async function triggerProcessing(
  fileContent: string,
  _userId: string, // Kept for compatibility but we use stored token
  clientIp: string
): Promise<string> {
  console.log('Starting triggerProcessing...');
  // Get real user ID and database ID from R2 with retries
  const { userId, databaseId } = await getTokenData();
  console.log('Retrieved userId and databaseId from R2:', { userId, databaseId });
  
  // Generate unique file name with real user ID from token
  const fileName = `clippings-${userId}-${Date.now()}.txt`;
  
  try {
    // Get pre-signed upload URL
    const uploadUrl = await getUploadUrl(fileName, 'text/plain');
    
    // Upload file directly to R2
    await axios.put(uploadUrl, fileContent, {
      headers: {
        'Content-Type': 'text/plain'
      },
      maxContentLength: Infinity, // Allow large file uploads
      maxBodyLength: Infinity // Allow large file uploads
    });
    
    console.log('\n=== GitHub Processing Trigger Start ===');
    console.log('File uploaded to R2:', {
      fileName,
      size: fileContent.length
    });
    
    // Get GitHub token - check both local and Vercel env vars
    const githubToken = process.env.GITHUB_ACCESS_TOKEN || process.env.VERCEL_GITHUB_TOKEN;
    console.log('Token validation:', {
      present: !!githubToken,
      length: githubToken?.length,
      format: githubToken?.startsWith('github_pat_') ? 'Fine-grained PAT' :
             githubToken?.startsWith('ghp_') ? 'Fine-grained token' :
             githubToken?.length === 40 ? 'Classic token' :
             'Unknown format',
      source: process.env.GITHUB_ACCESS_TOKEN ? 'local' : 'vercel'
    });

    if (!githubToken) {
      throw new Error('GitHub access token not configured');
    }

    // Always use 'token' prefix for GitHub PATs
    const authHeader = `token ${githubToken}`;

    // Verify token permissions with timeout and rate limit checking
    try {
      const tokenInfo = await axios.get('https://api.github.com/user', {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'BookSync-App'
        },
        timeout: 5000 // 5 second timeout
      });

      // Check rate limits
      const rateLimitRemaining = parseInt(tokenInfo.headers['x-ratelimit-remaining'] || '0');
      if (rateLimitRemaining < 10) {
        console.warn('Low GitHub API rate limit remaining:', rateLimitRemaining);
      }

      console.log('Token permissions:', {
        scopes: tokenInfo.headers['x-oauth-scopes'],
        userId: tokenInfo.data.id,
        login: tokenInfo.data.login,
        rateLimit: {
          limit: tokenInfo.headers['x-ratelimit-limit'],
          remaining: tokenInfo.headers['x-ratelimit-remaining'],
          reset: new Date(parseInt(tokenInfo.headers['x-ratelimit-reset'] || '0') * 1000).toISOString()
        }
      });

      // Check scopes - different headers for classic tokens vs fine-grained PATs
      const scopes = tokenInfo.headers['x-oauth-scopes'];
      const permissions = tokenInfo.headers['x-oauth-client-permissions'];
      
      console.log('Token permissions details:', {
        scopes,
        permissions,
        allHeaders: tokenInfo.headers
      });

      // Check for fine-grained PAT permissionless access or classic token workflow scope
      const allowsPermissionless = tokenInfo.headers['x-accepted-github-permissions']?.includes('allows_permissionless_access=true');
      if (!allowsPermissionless && !scopes?.includes('workflow') && !permissions?.includes('actions')) {
        throw new Error('Token missing required permissions. Needs workflow scope or actions permission');
      }

      // Verify token has repository access
      const repoAccess = await axios.get(
        'https://api.github.com/repos/ajiteshgogoi/booksync',
        {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'BookSync-App'
          },
          timeout: 5000
        }
      );

      if (repoAccess.status !== 200) {
        throw new Error('Token lacks repository access');
      }
    } catch (error: unknown) {
      const tokenError = error as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            documentation_url?: string;
          };
          headers?: Record<string, string>;
        };
      };
      
      const errorDetails = {
        status: tokenError.response?.status,
        message: tokenError.response?.data?.message,
        documentation: tokenError.response?.data?.documentation_url,
        responseData: tokenError.response?.data,
        responseHeaders: tokenError.response?.headers,
        allTokenInfoHeaders: tokenError.response?.headers,
        scopes: tokenError.response?.headers?.['x-oauth-scopes'],
        permissions: tokenError.response?.headers?.['x-oauth-client-permissions'],
        fullError: tokenError instanceof Error ? tokenError.message : 'Unknown error',
        authMethod: authHeader.split(' ')[0]
      };
      console.error('Token verification failed:', errorDetails);
      throw new Error(`GitHub token validation failed: ${errorDetails.message || errorDetails.fullError}`);
    }

    // Prepare the payload with only file reference - no large content
    const payload = {
      event_type: 'process_highlights',
      client_payload: {
        fileName, // Only send the R2 file reference
        userId,
        databaseId, // Added databaseId from R2
        timestamp: new Date().toISOString(),
        clientIp,
        fileSize: fileContent.length // Send file size for information
      }
    };

    console.log('\nPreparing GitHub dispatch:', {
      url: 'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
      payloadSize: JSON.stringify(payload).length,
      fileName,
      userId,
      databaseId
    });

    // Send the dispatch request
    try {
      const response = await axios.post(
        'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
        payload,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': authHeader,
            'User-Agent': 'BookSync-App',
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('\nGitHub API Response:', {
        status: response.status,
        statusText: response.statusText,
        rateLimit: {
          limit: response.headers['x-ratelimit-limit'],
          remaining: response.headers['x-ratelimit-remaining'],
          reset: response.headers['x-ratelimit-reset']
        }
      });

      if (response.status === 204) {
        console.log('\n✅ Successfully triggered GitHub workflow');
        return fileName;
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (apiError: any) {
      console.error('\nGitHub API Error:', {
        status: apiError.response?.status,
        message: apiError.response?.data?.message,
        documentation: apiError.response?.data?.documentation_url
      });

      if (apiError.response?.status === 404) {
        throw new Error('Repository not found or token lacks access');
      } else if (apiError.response?.status === 401) {
        throw new Error('Invalid or expired token');
      } else {
        throw new Error(`GitHub API error: ${apiError.response?.data?.message || apiError.message}`);
      }
    }
  } catch (error: any) {
    console.error('\n❌ Error in triggerProcessing:', {
      message: error.message,
      cause: error.cause
    });
    throw error;
  } finally {
    console.log('\n=== GitHub Processing Trigger End ===\n');
  }
}
