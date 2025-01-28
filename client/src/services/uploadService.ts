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

    const uploadUrl = await getUploadUrl(file.name, fileKey, file.type);
    console.log('Using upload URL:', uploadUrl);

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
    const parseResponse = await fetch('/api/parse-r2', {
      method: 'POST',
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

    const response = await fetch('/api/sync', {
      method: 'POST',
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