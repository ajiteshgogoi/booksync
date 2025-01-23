#!/usr/bin/env node
import { processFileContent } from './build/src/services/processService.js';
import { getRedis } from './build/src/services/redisService.js';
import { streamFile } from './build/src/services/r2Service.js';

async function getTokenData() {
  try {
    const redis = await getRedis();
    const keys = await redis.keys('oauth:*');
    
    if (keys.length === 0) {
      throw new Error('No OAuth tokens found in Redis');
    }

    console.log('Found OAuth keys:', keys);
    
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

    console.log('Retrieved token data:', tokenDataObj);
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
    const fileName = process.env.FILE_NAME;
    
    if (!fileName) {
      throw new Error('Missing required environment variable: FILE_NAME');
    }

    // Stream file from R2
    const fileStream = await streamFile(fileName);
    let fileContent = '';
    
    fileStream.on('data', (chunk) => {
      fileContent += chunk.toString();
    });

    await new Promise((resolve, reject) => {
      fileStream.on('end', resolve);
      fileStream.on('error', reject);
    });

    const { databaseId, userId } = await getTokenData();

    console.log('Starting file processing with:', {
      userId,
      databaseId,
      fileName,
      contentLength: fileContent.length
    });

    await processFileContent(userId, fileContent, databaseId);
    console.log('File processing completed successfully');
  } catch (error) {
    console.error('Failed to process file:', error);
    process.exit(1);
  }
}

main();
