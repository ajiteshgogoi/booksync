export async function getUploadUrl(fileName: string, fileKey: string, fileType: string): Promise<string> {
  const response = await fetch('/api/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName, fileKey, fileType }),
  });

  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }

  const data = await response.json();
  return data.url;
}

export async function uploadFileToR2(file: File, fileKey: string): Promise<{ count: number }> {
  // Validate file type and size
  const allowedTypes = ['text/plain', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only text and PDF files are allowed');
  }

  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    throw new Error('File size must be less than 10MB');
  }

  const uploadUrl = await getUploadUrl(file.name, fileKey, file.type);

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
      'Content-Length': file.size.toString(),
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file');
  }

  // Parse the uploaded file
  const parseResponse = await fetch('/api/parse-r2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileKey }),
  });

  if (!parseResponse.ok) {
    const errorData = await parseResponse.json();
    if (parseResponse.status === 429) {
      const remainingTime = Math.ceil(errorData.remainingTime / 60);
      throw new Error(`You have exceeded the upload limit of 2 uploads every 30 minutes. Please try again in ${remainingTime} minutes.`);
    }
    throw new Error(errorData.message || await parseResponse.text());
  }

  const data = await parseResponse.json();
  return data;
}