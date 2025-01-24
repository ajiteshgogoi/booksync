import { streamFile } from '../../server/src/services/r2Service';
import { Readable } from 'stream';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  console.log('Parse R2 request received:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  if (request.method !== 'POST') {
    console.warn('Method not allowed:', request.method);
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { fileKey } = body;

    if (!fileKey) {
      console.error('Missing required parameter: fileKey');
      return new Response('FileKey is required', { status: 400 });
    }

    console.log('Streaming file from R2:', fileKey);
    const fileStream = await streamFile(fileKey);
    console.log('File stream obtained');

    console.log('Creating FormData...');
    const formData = new FormData();
    const blob = await streamToBlob(fileStream);
    console.log('Blob created:', {
      size: blob.size,
      type: blob.type
    });
    
    const fileName = fileKey.split('/').pop() || 'My Clippings.txt';
    formData.append('file', blob, fileName);
    console.log('FormData created with file:', fileName);

    console.log('Forwarding to parse endpoint:', process.env.API_URL);
    const response = await fetch(`${process.env.API_URL}/parse`, {
      method: 'POST',
      body: formData,
    });

    console.log('Parse endpoint response:', {
      status: response.status,
      statusText: response.statusText
    });

    return response;
  } catch (error) {
    console.error('Error parsing file from R2:', {
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString()
    });
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