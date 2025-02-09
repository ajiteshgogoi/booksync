export async function getUploadUrl(fileName: string, fileKey: string, fileType: string): Promise<string> {
  try {
    console.log('Requesting upload URL for:', { fileName, fileKey, fileType });
    
    const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
    const response = await fetch(`${apiBase}/upload-url`, {
      method: 'POST',
      credentials: 'include',
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
      const errorData = await response.json();
      console.error('Upload URL request failed:', {
        status: response.status,
        error: errorData
      });
      // Pass through the error message directly
      throw new Error(errorData.message);
    }

    const data = await response.json();
    console.log('Received upload URL:', data.url);
    return data.url;
  } catch (error) {
    console.error('Error in getUploadUrl:', {
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString()
    });
    if (error instanceof Error) {
      throw error;  // Re-throw the original error to preserve its message
    }
    // Only use generic message if error is not an Error instance
    throw new Error('An unexpected error occurred. Please try again later.');
  }
}

export async function uploadFileToR2(file: File, fileKey: string): Promise<{ count: number, fileKey: string }> {
  try {
    console.log('Starting file upload:', {
      fileName: file.name,
      fileKey,
      fileType: file.type,
      fileSize: file.size
    });

    // Validate file type and size
    const allowedTypes = ['text/plain', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only text and PDF files are allowed');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }

    let uploadUrl: string;
    try {
      uploadUrl = await getUploadUrl(file.name, fileKey, file.type);
      console.log('Using upload URL:', uploadUrl);
    } catch (error) {
      // Re-throw errors from getUploadUrl to preserve the message
      throw error;
    }

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      mode: 'cors',
      body: file,
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
        'Origin': window.location.origin
      },
    });

    console.log('Upload response:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text();
      console.error('Upload failed:', {
        status: uploadResponse.status,
        error: errorBody
      });
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    console.log('Parsing uploaded file...');
    const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
    const parseResponse = await fetch(`${apiBase}/parse-r2`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileKey }),
    });

    console.log('Parse response:', {
      status: parseResponse.status,
      statusText: parseResponse.statusText
    });

    if (!parseResponse.ok) {
      const errorData = await parseResponse.json();
      console.error('Parse failed:', {
        status: parseResponse.status,
        error: errorData
      });

      if (parseResponse.status === 429) {
        throw new Error(errorData.message);
      }
      throw new Error(errorData.message || await parseResponse.text());
    }

    const data = await parseResponse.json();
    console.log('Parse successful:', data);
    return { ...data, fileKey }; // Return the fileKey along with count
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

export async function syncWithFileKey(fileKey: string): Promise<void> {
  try {
    console.log('Starting sync with fileKey:', fileKey);

    const apiBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL;
    const response = await fetch(`${apiBase}/sync`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileKey }),
    });

    console.log('Sync response:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sync failed:', {
        status: response.status,
        error: errorData
      });

      if (response.status === 429) {
        throw new Error(errorData.message);
      }
      throw new Error(errorData.message || await response.text());
    }

    const data = await response.json();
    console.log('Sync successful:', data);
  } catch (error) {
    console.error('Error in syncWithFileKey:', {
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString()
    });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to sync file. Please try again later.');
  }
}