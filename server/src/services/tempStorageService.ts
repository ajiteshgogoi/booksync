import { logger } from '../utils/logger.js';
import { uploadObject, downloadObject, deleteObject } from './r2Service.js';
import { Highlight } from './notionClient.js';

const TEMP_PREFIX = 'temp/';
const HIGHLIGHTS_PREFIX = 'highlights/';

export class TempStorageService {
  private static instance: TempStorageService;

  private constructor() {}

  static getInstance(): TempStorageService {
    if (!TempStorageService.instance) {
      TempStorageService.instance = new TempStorageService();
    }
    return TempStorageService.instance;
  }

  private getHighlightPath(jobId: string): string {
    return `${HIGHLIGHTS_PREFIX}${jobId}.json`;
  }

  private getContentPath(jobId: string): string {
    return `${TEMP_PREFIX}${jobId}.txt`;
  }

  async storeFileContent(jobId: string, content: string): Promise<void> {
    try {
      await uploadObject(this.getContentPath(jobId), content);
    } catch (error) {
      logger.error('Error storing file content in R2', { jobId, error });
      throw error;
    }
  }

  async getFileContent(jobId: string): Promise<string> {
    try {
      const buffer = await downloadObject(this.getContentPath(jobId));
      return buffer.toString('utf-8');
    } catch (error) {
      logger.error('Error reading file content from R2', { jobId, error });
      throw error;
    }
  }

  async storeHighlights(jobId: string, highlights: Highlight[]): Promise<void> {
    try {
      await uploadObject(
        this.getHighlightPath(jobId),
        JSON.stringify(highlights)
      );
    } catch (error) {
      logger.error('Error storing highlights in R2', { jobId, error });
      throw error;
    }
  }

  async getHighlights(jobId: string): Promise<Highlight[]> {
    try {
      const path = this.getHighlightPath(jobId);
      logger.debug('Attempting to get highlights from R2', {
        jobId,
        path
      });

      const buffer = await downloadObject(path);
      if (!buffer) {
        logger.error('No data returned from R2', { jobId, path });
        throw new Error('No data returned from R2');
      }

      const content = buffer.toString('utf-8');
      if (!content) {
        logger.error('Empty content from R2', { jobId, path });
        throw new Error('Empty content from R2');
      }

      try {
        const highlights = JSON.parse(content);
        logger.debug('Successfully parsed highlights', {
          jobId,
          highlightCount: highlights.length
        });
        return highlights;
      } catch (parseError) {
        logger.error('Failed to parse highlights JSON', {
          jobId,
          path,
          content: content.substring(0, 100) + '...',
          error: parseError
        });
        throw parseError;
      }
    } catch (error) {
      const e = error as Error;
      logger.error('Error reading highlights from R2', {
        jobId,
        path: this.getHighlightPath(jobId),
        error: e.message,
        stack: e.stack
      });
      throw error;
    }
  }

  async cleanupJob(jobId: string): Promise<void> {
    try {
      // Properly delete objects instead of uploading empty content
      await deleteObject(this.getContentPath(jobId));
      await deleteObject(this.getHighlightPath(jobId));
    } catch (error) {
      logger.error('Error cleaning up job files from R2', { jobId, error });
      // Don't throw error for cleanup failures
    }
  }

  async exists(jobId: string, type: 'content' | 'highlights'): Promise<boolean> {
    try {
      const path = type === 'content' 
        ? this.getContentPath(jobId)
        : this.getHighlightPath(jobId);
      // Try to get object info - if it succeeds, the file exists
      await downloadObject(path);
      return true;
    } catch {
      return false;
    }
  }

  // Helper method to store processing state between steps
  async storeProcessingState(jobId: string, state: any): Promise<void> {
    try {
      await uploadObject(
        `${TEMP_PREFIX}${jobId}_state.json`,
        JSON.stringify(state)
      );
    } catch (error) {
      logger.error('Error storing processing state in R2', { jobId, error });
      throw error;
    }
  }

  // Helper method to retrieve processing state
  async getProcessingState(jobId: string): Promise<any> {
    try {
      const buffer = await downloadObject(`${TEMP_PREFIX}${jobId}_state.json`);
      return JSON.parse(buffer.toString('utf-8'));
    } catch (error) {
      if ((error as any)?.name === 'NoSuchKey') {
        logger.debug('No processing state found in R2', { jobId });
        return null;
      }
      logger.error('Error reading processing state from R2', { jobId, error });
      throw error;
    }
  }
}

export const tempStorageService = TempStorageService.getInstance();