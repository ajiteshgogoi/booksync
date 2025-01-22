import axios from 'axios';

export async function triggerProcessing(
  fileContent: string,
  userId: string
): Promise<void> {
  try {
    // Get GitHub token from environment
    const githubToken = process.env.GITHUB_ACCESS_TOKEN;
    if (!githubToken) {
      throw new Error('GitHub access token not configured');
    }

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
          'Authorization': `Bearer ${githubToken}`
        }
      }
    );

    if (response.status !== 204) {
      throw new Error(`Failed to trigger processing: ${response.status}`);
    }

    console.log('Successfully triggered file processing');
  } catch (error) {
    console.error('Error triggering processing:', error);
    throw error;
  }
}