import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ENDPOINT || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_BUCKET_NAME) {
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
