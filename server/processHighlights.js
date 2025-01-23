#!/usr/bin/env node
import dotenv from 'dotenv';
import { processFileContent } from './build/src/services/processService.js';
import { getRedis } from './build/src/services/redisService.js';
import { streamFile } from './build/src/services/r2Service.js';

dotenv.config();

// Debug helper
const debug = (...args) => console.log('[Debug]', ...args);

async function getTokenData() {
  try {
    const redis = await getRedis();
    const keys = await redis.keys('oauth:*');
    
    if (keys.length === 0) {
      throw new Error('No OAuth tokens found in Redis');
    }

    debug('Found OAuth keys:', keys);
    
    // Get the first workspace's token data
    const tokenData = await redis.get(keys[0]);
    if (!tokenData) {
      throw new Error('Failed to retrieve token data from Redis');
    }

    const tokenDataObj = JSON.parse(tokenData);
    
    // Validate database ID format (Notion database IDs are UUIDs)
    if (!tokenDataObj.databaseId || typeof tokenDataObj.databaseId !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(tokenDataObj.databaseId)) {
      throw new Error(`Invalid database ID format. Expected UUID, got: ${tokenDataObj.databaseId}`);
    }
    
    if (!tokenDataObj.userId || typeof tokenDataObj.userId !== 'string') {
      throw new Error(`Invalid user ID format: ${tokenDataObj.userId}`);
    }

    debug('Retrieved token data:', tokenDataObj);
    return {
      databaseId: tokenDataObj.databaseId,
      userId: tokenDataObj.userId
    };
  } catch (error) {
    console.error('Error retrieving token data:', error);
    throw error;
  }
}

async function main() {
  try {
    const inputFileName = process.env.FILE_NAME;
    
    if (!inputFileName) {
      throw new Error('Missing required environment variable: FILE_NAME');
    }

    // Transform filename to match R2 format
    // Extract timestamp from the environment variable or use current timestamp
    const envTimestamp = process.env.TIMESTAMP || Date.now().toString();
    const r2FileName = `clippings-default-user-id-${envTimestamp}.txt`;

    debug('Starting file processing:', { inputFileName, r2FileName });

    // Stream file from R2
    debug('Streaming file from R2...');
    const fileStream = await streamFile(r2FileName);
    let fileContent = '';
    
    // Convert stream to string
    debug('Converting stream to string...');
    for await (const chunk of fileStream) {
      fileContent += chunk.toString();
    }

    debug('File loaded from R2:', {
      r2FileName,
      contentLength: fileContent.length,
      contentPreview: fileContent.slice(0, 100) + '...'
    });

    debug('Getting token data...');
    const { databaseId, userId } = await getTokenData();

    debug('Starting highlights processing with:', {
      userId,
      databaseId,
      r2FileName,
      contentLength: fileContent.length
    });

    await processFileContent(userId, fileContent, databaseId);
    console.log('File processing completed successfully');
  } catch (error) {
    console.error('Failed to process file:', error);
    // Log detailed error information
    if (error.response) {
      console.error('Response error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
