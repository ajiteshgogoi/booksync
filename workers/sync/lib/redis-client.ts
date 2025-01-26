import Redis from 'ioredis';
import { RedisOptions } from 'ioredis';

// Replace built-in module imports with node: prefix
const module = {
  require: (name: string) => {
    switch (name) {
      case 'util': return require('node:util');
      case 'events': return require('node:events');
      case 'stream': return require('node:stream');
      case 'crypto': return require('node:crypto');
      case 'dns': return require('node:dns');
      case 'net': return require('node:net');
      case 'tls': return require('node:tls');
      case 'url': return require('node:url');
      case 'assert': return require('node:assert');
      case 'buffer': return require('node:buffer');
      case 'string_decoder': return require('node:string_decoder');
      default: return require(name);
    }
  }
};

// Create a Redis client that uses our modified require
export class RedisClient extends Redis {
  constructor(options: RedisOptions) {
    super(options);
    // Override require for any internal Redis calls
    (global as any).require = module.require;
  }

  // Add custom methods if needed
  async xreadGroup(
    group: string,
    consumer: string,
    streams: [string, string][],
    opts?: { count?: number; block?: number }
  ) {
    const args = ['XREADGROUP', 'GROUP', group, consumer];
    if (opts?.count) args.push('COUNT', opts.count.toString());
    if (opts?.block) args.push('BLOCK', opts.block.toString());
    args.push('STREAMS', ...streams.map(([key]) => key), ...streams.map(([, id]) => id));
    return this.call('xreadgroup', args);
  }
}