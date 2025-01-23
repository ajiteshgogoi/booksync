#!/usr/bin/env node
import dotenv from 'dotenv';
import { processFileContent } from './build/src/services/processService.js';
import { RedisService, redisPool } from './build/src/services/redisService.js';
import { streamFile } from './build/src/services/r2Service.js';

dotenv.config();

// Debug helper with timestamp
const debug = (...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[Debug ${timestamp}]`, ...args);
};

async function getTokenData() {
  debug('Initializing Redis service...');
  const redis = await RedisService.init();
  debug('Redis service initialized');
  
  try {
    debug('Searching for OAuth keys...');
    const keys = await redis.keys('oauth:*');
    
    if (keys.length === 0) {
      throw new Error('No OAuth tokens found in Redis');
    }

    debug('Found OAuth keys:', keys);
    
    // Get the first workspace's token data
    debug('Retrieving token data...');
    const tokenData = await redis.get(keys[0]);
    if (!tokenData) {
      throw new Error('Failed to retrieve token data from Redis');
    }

    debug('Parsing token data...');
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
      userId: tokenDataObj.userId,
      redis // Return redis instance for cleanup
    };
  } catch (error) {
    console.error('Error retrieving token data:', error);
    throw error;
  }
}

async function main() {
  let redisInstance = null;
  
  try {
    debug('Starting main process...');
    const fileName = process.env.FILE_NAME;
    const r2FileName = process.env.R2_FILE_NAME;
    
    if (!fileName || !r2FileName) {
      throw new Error(`Missing required environment variables: ${!fileName ? 'FILE_NAME' : ''} ${!r2FileName ? 'R2_FILE_NAME' : ''}`);
    }

    debug('Environment variables validated:', { fileName, r2FileName });

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
    const { databaseId, userId, redis } = await getTokenData();
    redisInstance = redis;

    debug('Starting highlights processing with:', {
      userId,
      databaseId,
      r2FileName,
      contentLength: fileContent.length
    });

    await processFileContent(userId, fileContent, databaseId);
    debug('File processing completed successfully');
  } catch (error) {
    debug('Error occurred during processing:', {
      message: error.message,
      stack: error.stack,
      responseError: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    throw error;
  } finally {
    if (redisInstance) {
      debug('Cleaning up Redis instance...');
      try {
        await RedisService.cleanup();
        await redisPool.cleanup();
        debug('Redis cleanup completed');
      } catch (cleanupError) {
        console.error('Error during Redis cleanup:', cleanupError);
      }
    }
  }
}

// Top-level error handling with proper cleanup
main().catch(error => {
  console.error('Fatal error:', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle process termination
async function cleanupAndExit() {
  debug('Starting cleanup process...');
  try {
    // Clear any active intervals
    const activeIntervals = Object.keys(global).filter(key => key.startsWith('_interval_'));
    activeIntervals.forEach(interval => {
      clearInterval(global[interval]);
    });
    
    // Cleanup Redis services
    await RedisService.cleanup();
    await redisPool.cleanup();
    
    debug('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    debug('Exiting process');
    process.exit(0);
  }
}

process.on('SIGTERM', cleanupAndExit);
process.on('SIGINT', cleanupAndExit);
process.on('exit', cleanupAndExit);
