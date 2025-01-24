import { getUploadUrl } from '../services/r2Service';
import { Request, Response } from 'express';

export const uploadUrlHandler = async (req: Request, res: Response) => {
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