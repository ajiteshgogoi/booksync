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
    if (!this.kv || typeof this.kv.get !== 'function') {
      console.error('[KVStore] KV namespace is invalid:', this.kv);
      throw new KVStoreError('Invalid KV namespace', 'get', key);
    }

    try {
      console.log('[KVStore] Getting value for key:', key);
      const value = await this.kv.get(key);
      console.log('[KVStore] Retrieved value:', {
        key,
        hasValue: value !== null,
        valueLength: value?.length
      });
      return value;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[KVStore] Error getting key ${key}:`, message);
      throw new KVStoreError(`Failed to get KV value: ${message}`, 'get', key, error);
    }
  }

  async set(key: string, value: string, options?: KVStoreOptions): Promise<void> {
    if (!this.kv || typeof this.kv.put !== 'function') {
      console.error('[KVStore] KV namespace is invalid:', this.kv);
      throw new KVStoreError('Invalid KV namespace', 'set', key);
    }

    try {
      console.log('[KVStore] Setting value:', { key, valueLength: value.length });
      await this.kv.put(key, value, options);
      console.log('[KVStore] Successfully set value for key:', key);
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
  console.log('[KVStore] Creating KV store:', {
    hasKV: !!kv,
    type: kv ? 'CloudflareKVStore' : 'MemoryKVStore'
  });

  if (kv && (!kv.get || !kv.put || !kv.delete)) {
    console.error('[KVStore] Invalid KV namespace provided:', kv);
    throw new Error('Invalid KV namespace: missing required methods');
  }

  const store = kv ? new CloudflareKVStore(kv) : new MemoryKVStore();
  console.log('[KVStore] Successfully created store');
  return store;
}
