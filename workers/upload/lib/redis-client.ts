import Redis from 'ioredis';

export class RedisClient {
  private client: Redis;
  private connectionPromise: Promise<void>;

  constructor(options: { url: string }) {
    this.client = new Redis(options.url, {
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy: (times: number) => Math.min(times * 100, 500),
      maxRetriesPerRequest: 3,
      connectTimeout: 5000, // 5 second timeout
    });

    // Create a promise that resolves when connected or rejects on error
    this.connectionPromise = new Promise((resolve, reject) => {
      this.client.once('ready', () => {
        console.log('Redis connection ready');
        resolve();
      });
      
      this.client.once('error', (err) => {
        console.error('Redis initial connection error:', err);
        reject(err);
      });
    });

    // Continue listening for subsequent errors
    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  async connect(): Promise<void> {
    await this.connectionPromise;
  }

  async set(key: string, value: string, ...args: any[]): Promise<void> {
    await this.connect(); // Ensure connected before operation
    await this.client.set(key, value, ...args);
  }

  async xgroup(command: 'CREATE' | 'DESTROY', stream: string, group: string, id: string, mkstream?: 'MKSTREAM'): Promise<any> {
    await this.connect(); // Ensure connected before operation
    if (command === 'CREATE') {
      if (mkstream) {
        return this.client.xgroup(command, stream, group, id, mkstream);
      }
      return this.client.xgroup(command, stream, group, id);
    } else {
      return this.client.xgroup(command, stream, group);
    }
  }

  async xreadgroup(groupName: string, consumerName: string, streams: [string, string][]): Promise<any> {
    await this.connect(); // Ensure connected before operation
    return this.client.xreadgroup('GROUP', groupName, consumerName, 'STREAMS', ...streams.flat());
  }

  async xadd(key: string, id: string, ...args: string[]): Promise<string> {
    await this.connect(); // Ensure connected before operation
    const result = await this.client.xadd(key, id, ...args);
    if (result === null) {
      throw new Error('Failed to add entry to stream');
    }
    return result;
  }

  pipeline(): any {
    // Return the raw pipeline object since we don't need strong typing for pipeline operations
    return this.client.pipeline();
  }

  async quit(): Promise<void> {
    try {
      await this.client.quit();
      console.log('Redis connection closed gracefully');
    } catch (error) {
      console.error('Error while closing Redis connection:', error);
    }
  }
}
