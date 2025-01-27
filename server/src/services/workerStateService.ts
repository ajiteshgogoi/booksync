import { logger } from '../utils/logger.js';
import { uploadObject, downloadObject, deleteObject } from './r2Service.js';

export class WorkerStateService {
  private static instance: WorkerStateService;
  private static readonly STATE_TTL = 24 * 60 * 60; // 24 hours in seconds

  // R2 key prefixes for state tracking
  private static readonly UPLOAD_QUEUE_KEY = 'worker/upload_queue.json';
  private static readonly PROCESSING_UPLOAD_KEY = 'worker/processing_upload.json';
  private static readonly ACTIVE_USER_UPLOADS_KEY = 'worker/active_user_uploads.json';

  private constructor() {}

  static getInstance(): WorkerStateService {
    if (!WorkerStateService.instance) {
      WorkerStateService.instance = new WorkerStateService();
    }
    return WorkerStateService.instance;
  }

  async isUploadProcessing(): Promise<boolean> {
    try {
      await downloadObject(WorkerStateService.PROCESSING_UPLOAD_KEY);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getCurrentProcessingUpload(): Promise<string | null> {
    try {
      const data = await downloadObject(WorkerStateService.PROCESSING_UPLOAD_KEY);
      return JSON.parse(data.toString()).uploadId;
    } catch (error) {
      return null;
    }
  }

  async setProcessingUpload(uploadId: string | null): Promise<void> {
    try {
      if (uploadId) {
        await uploadObject(
          WorkerStateService.PROCESSING_UPLOAD_KEY,
          JSON.stringify({ uploadId, timestamp: Date.now() })
        );
      } else {
        await deleteObject(WorkerStateService.PROCESSING_UPLOAD_KEY);
      }
    } catch (error) {
      logger.error('Error setting processing upload:', error);
      throw error;
    }
  }

  async addToUploadQueue(uploadId: string): Promise<void> {
    try {
      const queueData = await this.getQueueData();
      queueData.queue.push({
        uploadId,
        timestamp: Date.now()
      });
      await uploadObject(WorkerStateService.UPLOAD_QUEUE_KEY, JSON.stringify(queueData));
    } catch (error) {
      logger.error('Error adding to upload queue:', error);
      throw error;
    }
  }

  async getUploadQueueLength(): Promise<number> {
    try {
      const queueData = await this.getQueueData();
      return queueData.queue.length;
    } catch (error) {
      return 0;
    }
  }

  async isInUploadQueue(uploadId: string): Promise<boolean> {
    try {
      const queueData = await this.getQueueData();
      return queueData.queue.some(item => item.uploadId === uploadId);
    } catch (error) {
      return false;
    }
  }

  async removeFromUploadQueue(uploadId: string): Promise<void> {
    try {
      const queueData = await this.getQueueData();
      queueData.queue = queueData.queue.filter(item => item.uploadId !== uploadId);
      await uploadObject(WorkerStateService.UPLOAD_QUEUE_KEY, JSON.stringify(queueData));
    } catch (error) {
      logger.error('Error removing from upload queue:', error);
      throw error;
    }
  }

  async getActiveUserUpload(userId: string): Promise<string | null> {
    try {
      const activeUploads = await this.getActiveUploadsData();
      return activeUploads[userId]?.uploadId || null;
    } catch (error) {
      return null;
    }
  }

  async setActiveUserUpload(userId: string, uploadId: string): Promise<void> {
    try {
      const activeUploads = await this.getActiveUploadsData();
      activeUploads[userId] = {
        uploadId,
        timestamp: Date.now()
      };
      await uploadObject(WorkerStateService.ACTIVE_USER_UPLOADS_KEY, JSON.stringify(activeUploads));
    } catch (error) {
      logger.error('Error setting active user upload:', error);
      throw error;
    }
  }

  async removeActiveUserUpload(userId: string): Promise<void> {
    try {
      const activeUploads = await this.getActiveUploadsData();
      delete activeUploads[userId];
      await uploadObject(WorkerStateService.ACTIVE_USER_UPLOADS_KEY, JSON.stringify(activeUploads));
    } catch (error) {
      logger.error('Error removing active user upload:', error);
      throw error;
    }
  }

  private async getQueueData(): Promise<{ queue: Array<{ uploadId: string; timestamp: number }> }> {
    try {
      const data = await downloadObject(WorkerStateService.UPLOAD_QUEUE_KEY);
      return JSON.parse(data.toString());
    } catch (error) {
      return { queue: [] };
    }
  }

  private async getActiveUploadsData(): Promise<Record<string, { uploadId: string; timestamp: number }>> {
    try {
      const data = await downloadObject(WorkerStateService.ACTIVE_USER_UPLOADS_KEY);
      return JSON.parse(data.toString());
    } catch (error) {
      return {};
    }
  }
}

export const workerStateService = WorkerStateService.getInstance();