import axios from 'axios';

export async function triggerProcessing(
  fileContent: string,
  userId: string
): Promise<void> {
  console.log('\n=== GitHub Processing Trigger Start ===');
  
  try {
    // Get GitHub token
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

    // Try a minimal dispatch first
    console.log('\nTesting dispatch with minimal payload...');
    try {
      const testResponse = await axios.post(
        'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
        {
          event_type: 'process_highlights_test',
          client_payload: {
            test: true
          }
        },
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${githubToken}`,
            'User-Agent': 'BookSync-App'
          }
        }
      );

      console.log('Test dispatch successful:', {
        status: testResponse.status,
        statusText: testResponse.statusText
      });
    } catch (testError: any) {
      console.error('Test dispatch failed:', {
        status: testError.response?.status,
        message: testError.response?.data?.message,
        documentation: testError.response?.data?.documentation_url
      });
      throw new Error(`GitHub dispatch test failed: ${testError.response?.data?.message || testError.message}`);
    }

    // If test succeeded, send the actual data
    console.log('\nSending full dispatch with file content...');
    const response = await axios.post(
      'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
      {
        event_type: 'process_highlights',
        client_payload: {
          fileContent,
          userId
        }
      },
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${githubToken}`,
          'User-Agent': 'BookSync-App'
        }
      }
    );

    if (response.status === 204) {
      console.log('\n✅ Successfully triggered GitHub workflow');
    } else {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error in triggerProcessing:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  } finally {
    console.log('\n=== GitHub Processing Trigger End ===\n');
  }
}