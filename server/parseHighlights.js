#!/usr/bin/env node
import dotenv from 'dotenv';
import { streamFile } from './build/src/services/r2Service.js';
import { queueSyncJob } from './build/src/services/syncService.js';
import { parseClippings } from './build/src/utils/parseClippings.js';
import { logger } from './build/src/utils/logger.js';

dotenv.config();

async function main() {
  try {
    logger.info('Starting highlight processing...');
    const { JOB_ID, USER_ID, DATABASE_ID, R2_FILE_NAME } = process.env;
    
    if (!JOB_ID || !USER_ID || !DATABASE_ID || !R2_FILE_NAME) {
      throw new Error('Missing required environment variables: JOB_ID, USER_ID, DATABASE_ID, R2_FILE_NAME');
    }

    logger.info('Processing file:', { 
      JOB_ID,
      USER_ID,
      DATABASE_ID,
      R2_FILE_NAME
    });

    // Stream file from R2
    const fileStream = await streamFile(R2_FILE_NAME);
    let fileContent = '';
    
    // Convert stream to string
    for await (const chunk of fileStream) {
      fileContent += chunk.toString();
    }

    logger.info('File loaded successfully:', {
      fileName: R2_FILE_NAME,
      contentLength: fileContent.length
    });

    // Parse the file content into highlights
    logger.info('Starting highlights parsing...');
    const highlights = await parseClippings(fileContent);
    logger.info(`Successfully parsed ${highlights.length} highlights`);
    
    // Queue sync job with parsed highlights
    logger.info('Starting sync job...');
    const jobId = await queueSyncJob(DATABASE_ID, USER_ID, highlights);
    logger.info('Sync job queued successfully', { jobId });
    
    process.exit(0);
  } catch (error) {
    logger.error('Error occurred during processing:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main().catch(error => {
  logger.error('Fatal error:', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});
