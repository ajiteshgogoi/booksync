import type { KVNamespace } from '@cloudflare/workers-types';

export interface KVStoreOptions {
  expirationTtl?: number; // TTL in seconds
}

export interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: KVStoreOptions): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<number>;
}

// Custom error class for KV operations
export class KVStoreError extends Error {
  constructor(
    message: string,
    public readonly operation: 'get' | 'set' | 'delete' | 'increment' | 'decrement',
    public readonly key: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'KVStoreError';
  }
}

// In-memory store for development/testing
class MemoryKVStore implements KVStore {
  private store = new Map<string, string>();
  private expirations = new Map<string, number>();

  async get(key: string): Promise<string | null> {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.store.delete(key);
      this.expirations.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, options?: KVStoreOptions): Promise<void> {
    this.store.set(key, value);
    if (options?.expirationTtl) {
      this.expirations.set(key, Date.now() + options.expirationTtl * 1000);
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
    this.expirations.delete(key);
  }

  async increment(key: string): Promise<number> {
    const value = await this.get(key);
    const newValue = (parseInt(value || '0', 10) + 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue, 10);
  }

  async decrement(key: string): Promise<number> {
    const value = await this.get(key);
    const newValue = Math.max(0, parseInt(value || '0', 10) - 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue, 10);
  }
}

// Cloudflare KV store implementation
class CloudflareKVStore implements KVStore {
  constructor(private kv: KVNamespace) {}

  async get(key: string): Promise<string | null> {
    try {
      return await this.kv.get(key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[KVStore] Error getting key ${key}:`, message);
      throw new KVStoreError(`Failed to get KV value: ${message}`, 'get', key, error);
    }
  }

  async set(key: string, value: string, options?: KVStoreOptions): Promise<void> {
    try {
      await this.kv.put(key, value, options);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[KVStore] Error setting key ${key}:`, message);
      throw new KVStoreError(`Failed to set KV value: ${message}`, 'set', key, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[KVStore] Error deleting key ${key}:`, message);
      throw new KVStoreError(`Failed to delete KV value: ${message}`, 'delete', key, error);
    }
  }

  async increment(key: string): Promise<number> {
    try {
      const value = await this.get(key);
      const newValue = (parseInt(value || '0', 10) + 1).toString();
      await this.set(key, newValue);
      return parseInt(newValue, 10);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new KVStoreError(`Failed to increment KV value: ${message}`, 'increment', key, error);
    }
  }

  async decrement(key: string): Promise<number> {
    try {
      const value = await this.get(key);
      const newValue = Math.max(0, parseInt(value || '0', 10) - 1).toString();
      await this.set(key, newValue);
      return parseInt(newValue, 10);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new KVStoreError(`Failed to decrement KV value: ${message}`, 'decrement', key, error);
    }
  }
}

// Factory function to create appropriate store
export function createKVStore(kv?: KVNamespace): KVStore {
  return kv ? new CloudflareKVStore(kv) : new MemoryKVStore();
}
