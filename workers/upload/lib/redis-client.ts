import Redis from 'ioredis';

export class RedisClient {
  private client: Redis;
  private connectionPromise: Promise<void>;
  private isConnected: boolean = false;

  constructor(options: { url: string }) {
    this.client = new Redis(options.url, {
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null; // stop retrying after 3 attempts
        }
        return Math.min(times * 100, 500);
      },
      maxRetriesPerRequest: 2,
      connectTimeout: 3000, // 3 second timeout
      commandTimeout: 3000, // 3 second timeout for commands
      keepAlive: 1000, // Keepalive every 1 second
      disconnectTimeout: 2000, // 2 second timeout when disconnecting
    });

    // Create a promise that resolves when connected or rejects on error
    this.connectionPromise = new Promise((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        reject(new Error('Redis connection timeout'));
      }, 5000);

      this.client.once('ready', () => {
        clearTimeout(connectionTimeout);
        console.log('Redis connection ready');
        this.isConnected = true;
        resolve();
      });
      
      this.client.once('error', (err) => {
        clearTimeout(connectionTimeout);
        console.error('Redis initial connection error:', err);
        this.isConnected = false;
        reject(err);
      });
    });

    // Continue listening for subsequent errors
    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('Redis connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      console.log('Redis reconnecting...');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await Promise.race([
          this.connectionPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.error('Redis connection failed:', error);
        throw error;
      }
    }
  }

  async set(key: string, value: string, ...args: any[]): Promise<void> {
    await this.connect();
    try {
      await this.client.set(key, value, ...args);
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
      throw error;
    }
  }

  async xgroup(command: 'CREATE' | 'DESTROY', stream: string, group: string, id: string, mkstream?: 'MKSTREAM'): Promise<any> {
    await this.connect();
    try {
      if (command === 'CREATE') {
        if (mkstream) {
          return await this.client.xgroup(command, stream, group, id, mkstream);
        }
        return await this.client.xgroup(command, stream, group, id);
      } else {
        return await this.client.xgroup(command, stream, group);
      }
    } catch (error) {
      console.error(`Redis XGROUP error for stream ${stream}:`, error);
      throw error;
    }
  }

  async xreadgroup(groupName: string, consumerName: string, streams: [string, string][]): Promise<any> {
    await this.connect();
    try {
      return await this.client.xreadgroup('GROUP', groupName, consumerName, 'STREAMS', ...streams.flat());
    } catch (error) {
      console.error(`Redis XREADGROUP error for group ${groupName}:`, error);
      throw error;
    }
  }

  async xadd(key: string, id: string, ...args: string[]): Promise<string> {
    await this.connect();
    try {
      const result = await this.client.xadd(key, id, ...args);
      if (result === null) {
        throw new Error('Failed to add entry to stream');
      }
      return result;
    } catch (error) {
      console.error(`Redis XADD error for key ${key}:`, error);
      throw error;
    }
  }

  pipeline(): any {
    if (!this.isConnected) {
      throw new Error('Cannot create pipeline: Redis not connected');
    }
    try {
      return this.client.pipeline();
    } catch (error) {
      console.error('Redis pipeline creation error:', error);
      throw error;
    }
  }

  async quit(): Promise<void> {
    if (this.isConnected) {
      try {
        await Promise.race([
          this.client.quit(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Redis quit timeout')), 2000)
          )
        ]);
        this.isConnected = false;
        console.log('Redis connection closed gracefully');
      } catch (error) {
        console.error('Error while closing Redis connection:', error);
        // Force disconnect if quit times out
        this.client.disconnect();
        throw error;
      }
    }
  }
}
