import axios from 'axios';
import { getUploadUrl } from './r2Service.js';
import { getRedis } from './redisService.js';

async function getTokenData(retryCount = 0): Promise<string> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  try {
    const redis = await getRedis();
    const keys = await redis.keys('oauth:*');
    
    if (keys.length === 0) {
      throw new Error('No OAuth tokens found in Redis');
    }
    
    const tokenData = await redis.get(keys[0]);
    if (!tokenData) {
      throw new Error('Failed to retrieve token data from Redis');
    }

    const tokenDataObj = JSON.parse(tokenData);
    
    if (!tokenDataObj.userId || typeof tokenDataObj.userId !== 'string') {
      throw new Error(`Invalid user ID format: ${tokenDataObj.userId}`);
    }

    console.log('Successfully retrieved user ID from Redis token');
    return tokenDataObj.userId;
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
  _userId: string, // Kept for compatibility but we use Redis token
  clientIp: string
): Promise<string> {
  console.log('Starting triggerProcessing...');
  // Get real user ID from Redis with retries
  const userId = await getTokenData();
  console.log('Retrieved userId from Redis:', userId);
  
  // Generate unique file name with real user ID from Redis
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
      format: githubToken?.startsWith('ghp_') ? 'Fine-grained token' :
             githubToken?.length === 40 ? 'Classic token' :
             'Unknown format',
      source: process.env.GITHUB_ACCESS_TOKEN ? 'local' : 'vercel'
    });

    if (!githubToken) {
      throw new Error('GitHub access token not configured');
    }

    // Prepare the payload with only file reference - no large content
    const payload = {
      event_type: 'process_highlights',
      client_payload: {
        fileName, // Only send the R2 file reference
        userId,
        timestamp: new Date().toISOString(),
        clientIp,
        fileSize: fileContent.length // Send file size for information
      }
    };

    console.log('\nPreparing GitHub dispatch:', {
      url: 'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
      payloadSize: JSON.stringify(payload).length,
      fileName
    });

    // Send the dispatch request
    try {
      const response = await axios.post(
        'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
        payload,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${githubToken}`,
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
