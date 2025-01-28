#!/usr/bin/env node
import dotenv from 'dotenv';
import { processFileContent } from './build/src/services/processService.js';
import { streamFile } from './build/src/services/r2Service.js';

dotenv.config();

// Debug helper with timestamp
const debug = (...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[Debug ${timestamp}]`, ...args);
};

async function main() {
  try {
    debug('Starting main process...');
    const { JOB_ID, USER_ID, DATABASE_ID, R2_FILE_NAME } = process.env;
    
    if (!JOB_ID || !USER_ID || !DATABASE_ID || !R2_FILE_NAME) {
      throw new Error('Missing required environment variables: JOB_ID, USER_ID, DATABASE_ID, R2_FILE_NAME');
    }

    debug('Environment variables validated:', { 
      JOB_ID,
      USER_ID,
      DATABASE_ID,
      R2_FILE_NAME
    });

    // Stream file from R2
    debug('Streaming file from R2...');
    const fileStream = await streamFile(R2_FILE_NAME);
    let fileContent = '';
    
    // Convert stream to string
    debug('Converting stream to string...');
    for await (const chunk of fileStream) {
      fileContent += chunk.toString();
    }

    debug('File loaded from R2:', {
      R2_FILE_NAME,
      contentLength: fileContent.length
    });

    debug('Starting highlights processing...');
    await processFileContent(USER_ID, fileContent, DATABASE_ID, JOB_ID);
    debug('File processing completed successfully');
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
