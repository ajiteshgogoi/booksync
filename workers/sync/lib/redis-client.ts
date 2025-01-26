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

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.client.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async xreadGroup(
    group: string,
    consumer: string,
    streams: [string, string][],
    opts?: { count?: number; block?: number }
  ): Promise<any> {
    const args = ['XREADGROUP', 'GROUP', group, consumer];
    if (opts?.count) args.push('COUNT', opts.count.toString());
    if (opts?.block) args.push('BLOCK', opts.block.toString());
    args.push('STREAMS', ...streams.map(([key]) => key), ...streams.map(([, id]) => id));
    return this.client.sendCommand(args);
  }

  async xread(args: string[]): Promise<any> {
    return this.client.sendCommand(['XREAD', ...args]);
  }

  async xdel(stream: string, id: string): Promise<void> {
    await this.client.sendCommand(['XDEL', stream, id]);
  }

  async quit(): Promise<void> {
    await this.client.quit();
  }
}