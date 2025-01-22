import axios from 'axios';

export async function triggerProcessing(
  fileContent: string,
  userId: string
): Promise<void> {
  console.log('\n=== GitHub Processing Trigger Start ===');
  
  try {
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

    // Prepare the payload
    const payload = {
      event_type: 'process_highlights',
      client_payload: {
        fileContent,
        userId,
        timestamp: new Date().toISOString()
      }
    };

    console.log('\nPreparing GitHub dispatch:', {
      url: 'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
      payloadSize: JSON.stringify(payload).length,
      contentLength: fileContent.length
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
        headers: response.headers
      });

      if (response.status === 204) {
        console.log('\n✅ Successfully triggered GitHub workflow');
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (apiError: any) {
      console.error('\nGitHub API Error:', {
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        message: apiError.response?.data?.message,
        documentation: apiError.response?.data?.documentation_url,
        headers: apiError.response?.headers
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
      cause: error.cause,
      stack: error.stack
    });
    throw error;
  } finally {
    console.log('\n=== GitHub Processing Trigger End ===\n');
  }
}