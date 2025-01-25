import { IncomingMessage, ServerResponse } from 'http';
import { getActiveUploadCount } from '../services/redisService.js';
import { UPLOAD_LIMITS } from '../config/uploadLimits';

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Method not allowed' }));
    return;
  }

  try {
    console.log('[API] Checking upload limits...');
    const activeUploads = await getActiveUploadCount();
    
    if (activeUploads >= UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS) {
      console.log(`[API] Upload limit reached (${activeUploads}/${UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS})`);
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        message: 'Too many users are using the service right now. Please try again later.',
        retryAfter: UPLOAD_LIMITS.UPLOAD_LIMIT_RETRY_DELAY
      }));
      return;
    }

    console.log(`[API] Upload limit check passed (${activeUploads}/${UPLOAD_LIMITS.MAX_ACTIVE_UPLOADS}). GitHub trigger will be allowed.`);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ activeUploads }));
  } catch (error) {
    console.error('Upload limit check failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Internal server error' }));
  }
}