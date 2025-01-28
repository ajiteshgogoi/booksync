import dotenv from 'dotenv';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  DeleteObjectCommand,
  ListObjectsV2Command
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { logger } from '../utils/logger.js';

dotenv.config();

export interface R2ObjectInfo {
  size: number;
  lastModified?: Date;
  contentType?: string;
}

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_NAME) {
  console.error('R2 Environment Variables:', {
    endpoint: !!R2_ENDPOINT,
    accessKey: !!R2_ACCESS_KEY,
    secretKey: !!R2_SECRET_KEY,
    bucketName: !!R2_BUCKET_NAME
  });
  throw new Error('Missing required R2 environment variables');
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

export async function getUploadUrl(fileName: string, fileType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating R2 upload URL:', error);
    throw new Error('Failed to generate upload URL');
  }
}

export async function streamFile(fileName: string): Promise<Readable> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No file content received from R2');
    }

    // AWS SDK v3 returns a ReadableStream, need to convert it to Node.js Readable
    if (response.Body instanceof Readable) {
      return response.Body;
    } else {
      // Convert Web ReadableStream to Node.js Readable
      const readable = new Readable();
      readable._read = () => {}; // Required implementation

      const reader = (response.Body as ReadableStream).getReader();
      
      // Process the stream
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              readable.push(null); // Signal end of stream
              break;
            }
            readable.push(value);
          }
        } catch (error) {
          readable.destroy(error as Error);
        }
      };

      processStream().catch(error => readable.destroy(error));
      return readable;
    }
  } catch (error) {
    console.error('Error streaming file from R2:', error);
    throw error;
  }
}

export async function getObjectInfo(key: string): Promise<R2ObjectInfo | null> {
  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    return {
      size: response.ContentLength || 0,
      lastModified: response.LastModified,
      contentType: response.ContentType
    };
  } catch (error) {
    if ((error as any)?.name === 'NotFound') {
      return null;
    }
    logger.error('Error getting object info from R2:', error);
    throw error;
  }
}

export async function downloadObject(key: string, retries = 3): Promise<Buffer> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No file content received from R2');
      }

      // Convert the readable stream to a buffer with timeout
      const chunks: Buffer[] = [];
      const stream = response.Body as Readable;
      
      const timeoutMs = 5000; // 5 second timeout
      const result = await Promise.race([
        new Promise<Buffer>((resolve, reject) => {
          stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          stream.on('error', reject);
          stream.on('end', () => resolve(Buffer.concat(chunks)));
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Download timeout')), timeoutMs)
        )
      ]);

      return result;
    } catch (error) {
      lastError = error as Error;
      const isNotFound = (error as any)?.name === 'NoSuchKey';
      
      if (isNotFound || attempt === retries) {
        logger.error('Error downloading object from R2:', {
          key,
          error,
          attempt,
          isNotFound
        });
        throw error;
      }
      
      // Wait with exponential backoff before retrying
      await new Promise(resolve =>
        setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
      );
    }
  }
  
  throw lastError;
}

export async function deleteObject(key: string, retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      logger.debug('Successfully deleted object from R2', { key });
      return;
    } catch (error) {
      const isNotFound = (error as any)?.name === 'NotFound';
      if (isNotFound) {
        logger.debug('Object already deleted from R2', { key });
        return;
      }
      
      if (attempt === retries) {
        logger.error('Error deleting object from R2:', { key, error, attempt });
        throw error;
      }
      
      await new Promise(resolve =>
        setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
      );
    }
  }
}

export async function listObjects(prefix: string, retries = 3): Promise<Array<{ key: string | undefined }>> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix
      });

      const response = await s3Client.send(command);
      return (response.Contents || []).map(obj => ({ key: obj.Key }));
    } catch (error) {
      if (attempt === retries) {
        logger.error('Error listing objects from R2:', { prefix, error, attempt });
        throw error;
      }
      
      await new Promise(resolve =>
        setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
      );
    }
  }
  return [];
}

export async function uploadObject(key: string, data: Buffer | string, retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        Body: data,
        ContentType: 'application/json', // Changed to JSON since we're storing JSON data
      });

      await s3Client.send(command);
      logger.debug('Successfully uploaded object to R2', { key });
      return;
    } catch (error) {
      if (attempt === retries) {
        logger.error('Error uploading object to R2:', { key, error, attempt });
        throw error;
      }
      
      await new Promise(resolve =>
        setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
      );
    }
  }
}
