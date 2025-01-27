import { Job } from '../types/job';

const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;

export async function pollJobStatus(jobId: string): Promise<Job> {
  try {
    const response = await fetch(`${apiBase}/jobs/${jobId}`, {
      headers: {
        'x-user-id': localStorage.getItem('userId') || 'anonymous'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch job status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error polling job status:', error);
    throw error;
  }
}

export async function getUploadUrl(fileName: string, fileKey: string, fileType: string): Promise<string> {
  try {
    console.log('Requesting upload URL for:', { fileName, fileKey, fileType });
    
    const response = await fetch('/api/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, fileKey, fileType }),
    });

    console.log('Upload URL response:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Upload URL request failed:', {
        status: response.status,
        error: errorBody
      });
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received upload URL:', data.url);
    return data.url;
  } catch (error) {
    console.error('Error in getUploadUrl:', {
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString()
    });
    throw new Error('Failed to generate upload URL. Please try again later.');
  }
}

export async function uploadFileToR2(file: File, fileKey: string): Promise<{ count: number; job: Job }> {
  try {
    console.log('Starting file upload:', {
      fileName: file.name,
      fileKey,
      fileType: file.type,
      fileSize: file.size
    });

    // Validate file type and size
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);
    
    const userId = localStorage.getItem('userId') || 'anonymous';
    const workspaceId = localStorage.getItem('workspaceId');

    if (!workspaceId) {
      throw new Error('No workspace ID found. Please reconnect to Notion.');
    }

    // Upload file to worker
    const uploadResponse = await fetch(`${apiBase}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'x-user-id': userId,
        'x-workspace-id': workspaceId
      },
      credentials: 'include'
    });

    console.log('Upload response:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    const job = await uploadResponse.json();
    console.log('Upload successful, job created:', job);

    // Count highlights in the file
    const reader = new FileReader();
    const count = await new Promise<number>((resolve, reject) => {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Simple count of "==========", which separates highlights in Kindle clippings
        const count = (text.match(/==========\n/g) || []).length;
        resolve(count);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });

    // Parse file in worker
    await fetch(`${apiBase}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-api-key': process.env.WORKER_API_KEY || ''
      },
      body: JSON.stringify({ jobId: job.id, userId }),
      credentials: 'include'
    });

    console.log('Sync initiated for job:', job.id);

    return { count, job };
  } catch (error) {
    console.error('Error in uploadFileToR2:', {
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString()
    });
    if (error instanceof Error) {
      throw error; // Preserve the original error message
    }
    throw new Error('Failed to upload and process file. Please try again later.');
  }
}