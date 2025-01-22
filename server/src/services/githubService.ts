import axios from 'axios';

export async function triggerProcessing(
  fileContent: string,
  userId: string
): Promise<void> {
  try {
    console.log('Starting GitHub processing trigger...');
    
    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubToken) {
      console.error('GitHub access token not found in environment variables');
      throw new Error('GitHub access token not configured');
    }
    console.log('GitHub token found');

    // Log the request we're about to make
    console.log('Preparing GitHub API request:', {
      url: 'https://api.github.com/repos/ajiteshgogoi/booksync/dispatches',
      eventType: 'process_highlights',
      payloadSize: fileContent.length,
      userId
    });

    // Create repository dispatch event
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
          'User-Agent': 'BookSync-App'  // Required by GitHub API
        }
      }
    ).catch(error => {
      // Log detailed error information
      console.error('GitHub API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        error: error.message
      });
      throw error;
    });

    console.log('GitHub API Response:', {
      status: response.status,
      statusText: response.status === 204 ? 'No Content (Success)' : response.statusText
    });

    if (response.status !== 204) {
      console.error('Unexpected response status:', response.status);
      throw new Error(`Failed to trigger processing: ${response.status}`);
    }

    console.log('Successfully triggered GitHub processing');
  } catch (error) {
    console.error('Error in triggerProcessing:', error);
    throw error;
  }
}