import dotenv from 'dotenv';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadObjectCommandOutput
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

export async function getUploadUrl(fileName: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    ContentType: 'text/plain',
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

export async function downloadObject(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No file content received from R2');
    }

    // Convert the readable stream to a buffer
    const chunks: Buffer[] = [];
    const stream = response.Body as Readable;
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  } catch (error) {
    logger.error('Error downloading object from R2:', error);
    throw error;
  }
}

export async function uploadObject(key: string, data: Buffer | string): Promise<void> {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: data,
      ContentType: 'text/plain', // Set appropriate content type
    });

    await s3Client.send(command);
    logger.debug('Successfully uploaded object to R2', { key });
  } catch (error) {
    logger.error('Error uploading object to R2:', error);
    throw error;
  }
}
