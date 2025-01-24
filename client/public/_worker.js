export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    // Handle static assets
    if (url.pathname.includes('.')) {
      try {
        return await env.ASSETS.fetch(request);
      } catch {
        return new Response('Not Found', { status: 404 });
      }
    }

    // Serve index.html for all other routes (SPA support)
    try {
      const response = await env.ASSETS.fetch(`${url.origin}/index.html`);
      return new Response(response.body, {
        ...response,
        headers: {
          ...response.headers,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  }
};