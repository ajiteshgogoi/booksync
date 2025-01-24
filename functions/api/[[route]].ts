import type { PagesFunction, EventContext, Response as WorkerResponse } from '@cloudflare/workers-types';

interface Env {
  R2: R2Bucket;
  NODE_ENV: string;
}

type Method = 'GET' | 'POST' | 'OPTIONS';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const jsonResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  }) as unknown as WorkerResponse;
};

export const onRequest: PagesFunction<Env> = async (context: EventContext<Env, string, unknown>) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    }) as unknown as WorkerResponse;
  }

  try {
    const url = new URL(request.url);
    const path = url.pathname.replace('/api/', '');

    switch (request.method as Method) {
      case 'POST': {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        
        if (!file) {
          return jsonResponse({ error: 'No file provided' }, 400);
        }

        const key = `${Date.now()}-${file.name}`;
        await env.R2.put(key, file, {
          httpMetadata: {
            contentType: file.type || 'application/octet-stream',
          }
        });

        return jsonResponse({ success: true, key });
      }

      case 'GET': {
        const key = path.split('/').pop();
        
        if (!key) {
          return jsonResponse({ error: 'File key required' }, 400);
        }

        const object = await env.R2.get(key);

        if (!object) {
          return jsonResponse({ error: 'File not found' }, 404);
        }

        return new Response(object.body, {
          headers: {
            ...corsHeaders,
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000'
          }
        }) as unknown as WorkerResponse;
      }

      default:
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }
  } catch (error) {
    console.error('API Error:', error);
    return jsonResponse({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
};

export const onRequestGet = onRequest;
export const onRequestPost = onRequest;
export const onRequestOptions = onRequest;