#!/usr/bin/env node
import dotenv from 'dotenv';
import { streamFile } from './build/src/services/r2Service.js';
import { queueSyncJob } from './build/src/services/syncService.js';
import { parseClippings } from './build/src/utils/parseClippings.js';
import { logger } from './build/src/utils/logger.js';

dotenv.config();

async function main() {
  try {
    logger.debug('Starting main process...');
    const { JOB_ID, USER_ID, DATABASE_ID, R2_FILE_NAME } = process.env;
    
    if (!JOB_ID || !USER_ID || !DATABASE_ID || !R2_FILE_NAME) {
      throw new Error('Missing required environment variables: JOB_ID, USER_ID, DATABASE_ID, R2_FILE_NAME');
    }

    logger.debug('Environment variables validated:', {
      JOB_ID,
      USER_ID,
      DATABASE_ID,
      R2_FILE_NAME
    });

    // Stream file from R2
    logger.debug('Streaming file from R2...');
    const fileStream = await streamFile(R2_FILE_NAME);
    let fileContent = '';
    
    // Convert stream to string
    logger.debug('Converting stream to string...');
    for await (const chunk of fileStream) {
      fileContent += chunk.toString();
    }

    logger.debug('File loaded from R2:', {
      R2_FILE_NAME,
      contentLength: fileContent.length
    });

    // Parse the file content into highlights
    logger.debug('Parsing highlights from file content...');
    const highlights = await parseClippings(fileContent);
    
    logger.debug('Starting sync job with parsed highlights...');
    await queueSyncJob(DATABASE_ID, USER_ID, highlights);
    logger.debug('File processing completed successfully');
    process.exit(0);
  } catch (error) {
    debug('Error occurred during processing:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(error => {
  console.error('Fatal error:', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});
