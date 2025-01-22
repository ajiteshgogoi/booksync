import axios from 'axios';

export async function triggerProcessing(
  fileContent: string,
  userId: string
): Promise<void> {
  console.log('\n=== GitHub Processing Trigger Start ===');
  
  try {
    // Get and validate GitHub token
    const githubToken = process.env.GITHUB_ACCESS_TOKEN;
    console.log('Token validation:', {
      present: !!githubToken,
      length: githubToken?.length,
      format: githubToken?.startsWith('ghp_') ? 'Fine-grained token' : 
             githubToken?.length === 40 ? 'Classic token' : 
             'Unknown format'
    });

    if (!githubToken) {
      throw new Error('GitHub access token not configured');
    }

    // Test API connection first
    try {
      console.log('\nTesting GitHub API connection...');
      const testResponse = await axios.get(
        'https://api.github.com/repos/ajiteshgogoi/booksync',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${githubToken}`,
            'User-Agent': 'BookSync-App'
          }
        }
      );
      console.log('Repository access test successful:', {
        status: testResponse.status,
        repoName: testResponse.data?.full_name
      });
    } catch (testError: any) {
      console.error('Repository access test failed:', {
        status: testError.response?.status,
        message: testError.response?.data?.message || testError.message
      });
      throw new Error(`GitHub API access test failed: ${testError.response?.data?.message || testError.message}`);
    }

    // Prepare dispatch request
    const payload = {
      event_type: 'process_highlights',
      client_payload: {
        fileContent,
        userId
      }
    };

    console.log('\nSending dispatch request:', {
      url: 'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
      eventType: payload.event_type,
      contentLength: fileContent.length
    });

    // Send the actual request
    try {
      const response = await axios.post(
        'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
        payload,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${githubToken}`,
            'User-Agent': 'BookSync-App',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 204) {
        console.log('\n✅ Successfully triggered GitHub workflow');
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (dispatchError: any) {
      console.error('\nDispatch request failed:', {
        status: dispatchError.response?.status,
        message: dispatchError.response?.data?.message || dispatchError.message,
        documentation: dispatchError.response?.data?.documentation_url
      });
      throw dispatchError;
    }

  } catch (error) {
    console.error('\n❌ Error in triggerProcessing:', error);
    throw error;
  } finally {
    console.log('\n=== GitHub Processing Trigger End ===\n');
  }
}