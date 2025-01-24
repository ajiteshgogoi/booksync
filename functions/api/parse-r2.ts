import { streamFile } from '../../server/src/services/r2Service';
import { Readable } from 'stream';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { fileKey } = body;

    if (!fileKey) {
      return new Response('FileKey is required', { status: 400 });
    }

    // Get file from R2
    const fileStream = await streamFile(fileKey);

    // Create FormData with the file
    const formData = new FormData();
    const blob = await streamToBlob(fileStream);
    formData.append('file', blob, fileKey.split('/').pop() || 'My Clippings.txt');

    // Forward to existing parse endpoint
    const response = await fetch(`${process.env.API_URL}/parse`, {
      method: 'POST',
      body: formData,
    });

    return response;
  } catch (error) {
    console.error('Error parsing file from R2:', error);
    return new Response('Error parsing file', { status: 500 });
  }
}

async function streamToBlob(stream: Readable): Promise<Blob> {
  const chunks: Uint8Array[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('end', () => resolve(new Blob(chunks, { type: 'text/plain' })));
    stream.on('error', reject);
  });
}