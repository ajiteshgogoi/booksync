import { getUploadUrl } from '../../server/src/services/r2Service';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    const { fileName, fileKey, fileType } = body;

    if (!fileName || !fileKey || !fileType) {
      return new Response('Filename, fileKey and fileType are required', { status: 400 });
    }

    const uploadUrl = await getUploadUrl(fileKey, fileType);

    return new Response(JSON.stringify({ url: uploadUrl }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return new Response('Error generating upload URL', { status: 500 });
  }
}