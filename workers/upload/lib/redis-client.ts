import Redis, { Command } from 'ioredis';

export class RedisClient {
  private client: Redis;

  constructor(options: { url: string }) {
    this.client = new Redis(options.url, {
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy: (times: number) => Math.min(times * 100, 500),
      maxRetriesPerRequest: 3
    });

    // Handle connection errors
    this.client.on('error', (err) => {
      console.error('Redis connection error:', err);
    });
  }

  async connect() {
    // Connection is handled automatically by ioredis
    return Promise.resolve();
  }

  async set(key: string, value: string, options?: any): Promise<void> {
    await this.client.set(key, value, options);
  }

  async xgroup(command: 'CREATE' | 'DESTROY', stream: string, group: string, id: string, mkstream?: 'MKSTREAM'): Promise<any> {
    if (command === 'CREATE') {
      const args = mkstream ? 
        ['XGROUP', command, stream, group, id, mkstream] :
        ['XGROUP', command, stream, group, id];
      // @ts-ignore - ioredis types are not perfectly accurate
      return this.client.command(args[0], args.slice(1));
    } else {
      // @ts-ignore - ioredis types are not perfectly accurate
      return this.client.command('XGROUP', [command, stream, group]);
    }
  }

  async xreadgroup(args: string[]): Promise<any> {
    // @ts-ignore - ioredis types are not perfectly accurate
    return this.client.command('XREADGROUP', args);
  }

  async xadd(key: string, id: string, ...args: string[]): Promise<string> {
    // @ts-ignore - ioredis types are not perfectly accurate
    return this.client.command('XADD', [key, id, ...args]);
  }

  pipeline(): any {
    return this.client.pipeline();
  }

  async quit(): Promise<void> {
    await this.client.quit();
  }
}