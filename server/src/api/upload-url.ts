import { getUploadUrl } from '../services/r2Service.js';
import { Request, Response } from 'express';
import { rateLimiter } from '../services/rateLimiter.js';

// Handle CORS preflight requests
export const corsHandler = (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin',
    process.env.NODE_ENV === 'production'
      ? 'https://booksync.vercel.app'
      : 'http://localhost:5173'
  );
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(204).end();
};

export const uploadUrlHandler = async (req: Request, res: Response) => {
  // Set CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin',
    process.env.NODE_ENV === 'production'
      ? 'https://booksync.vercel.app'
      : 'http://localhost:5173'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  console.log('Upload URL request received:', {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers
  });

  if (req.method !== 'POST') {
    console.warn('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get client IP address
    const xForwardedFor = req.headers['x-forwarded-for'];
    const clientIp = Array.isArray(xForwardedFor) 
      ? xForwardedFor[0] 
      : (xForwardedFor || req.socket.remoteAddress);

    if (!clientIp || typeof clientIp !== 'string') {
      return res.status(400).json({ error: 'Could not determine client IP' });
    }

    // Check rate limit (but don't increment)
    const rateLimit = rateLimiter.check(clientIp);
    if (!rateLimit.allowed) {
      const remainingMinutes = Math.ceil(rateLimit.remainingTime / 60);
      const errorMessage = `You have exceeded the upload limit of 2 uploads per hour. Please try again in ${remainingMinutes} minutes.`;
      console.log('Rate limit exceeded:', {
        clientIp,
        remainingMinutes,
        message: errorMessage
      });
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: errorMessage
      });
    }

    const { fileName, fileKey, fileType } = req.body;
    console.log('Request body:', req.body);
    
    if (!fileName || !fileKey || !fileType) {
      console.error('Missing required parameters:', {
        fileName: !!fileName,
        fileKey: !!fileKey,
        fileType: !!fileType
      });
      return res.status(400).json({ error: 'Filename, fileKey and fileType are required' });
    }

    console.log('Generating upload URL for:', { fileKey, fileType });
    const uploadUrl = await getUploadUrl(fileKey, fileType);
    console.log('Generated upload URL:', uploadUrl);

    return res.status(200).json({ url: uploadUrl });
  } catch (error) {
    console.error('Error generating upload URL:', {
      error: error instanceof Error ? error.stack : error,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({ error: 'Error generating upload URL' });
  }
};