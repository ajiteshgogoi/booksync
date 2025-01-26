import { createClient, RedisClientType } from '@redis/client';

export class RedisClient {
  private client: RedisClientType;

  constructor(options: { url: string }) {
    this.client = createClient({
      url: options.url,
      socket: {
        tls: true,
        reconnectStrategy: (retries: number) => Math.min(retries * 100, 500)
      }
    }) as RedisClientType;
  }

  async connect() {
    await this.client.connect();
  }

  async set(key: string, value: string, options?: any): Promise<void> {
    await this.client.set(key, value, options);
  }

  async xgroup(command: 'CREATE' | 'DESTROY', stream: string, group: string, id: string, mkstream?: 'MKSTREAM') {
    return this.client.sendCommand(['XGROUP', command, stream, group, id, ...(mkstream ? [mkstream] : [])]);
  }

  async xreadgroup(args: string[]): Promise<any> {
    return this.client.sendCommand(['XREADGROUP', ...args]);
  }

  async xadd(key: string, id: string, ...args: string[]): Promise<string> {
    return this.client.sendCommand(['XADD', key, id, ...args]);
  }

  pipeline(): any {
    return this.client.multi();
  }

  async quit(): Promise<void> {
    await this.client.quit();
  }
}