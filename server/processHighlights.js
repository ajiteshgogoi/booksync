#!/usr/bin/env node
import { processFileContent } from './build/src/services/processService.js';

async function main() {
  try {
    const fileContent = process.env.FILE_CONTENT;
    const userId = process.env.USER_ID;
    const databaseId = process.env.DATABASE_ID;
    
    if (!fileContent || !userId || !databaseId) {
      throw new Error('Missing required environment variables');
    }

    console.log('Starting file processing with:', {
      userId,
      databaseId,
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