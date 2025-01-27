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

  async ready(): Promise<void> {
    // Test connection by getting a non-existent key
    try {
      await this.get('__connection_test__');
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(new Error('Failed to connect to Cloudflare KV'));
    }
  }

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
export interface KVStoreConfig {
  type: 'CloudflareKVStore' | 'MemoryKVStore';
  accountId?: string;
  namespaceId?: string;
  apiToken?: string;
}

export function createKVStore(config?: KVStoreConfig | KVNamespace): KVStore {
  let store: KVStore;
  
  if (config && typeof config === 'object' && 'type' in config) {
    // Using config object
    console.log('[KVStore] Creating KV store with config:', config);
    
    if (config.type === 'CloudflareKVStore') {
      if (!config.accountId || !config.namespaceId || !config.apiToken) {
        throw new Error('Missing required Cloudflare KV configuration');
      }
      
      // Create Cloudflare KV namespace
      const kv = {
        get: async (key: string) => {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/kv/namespaces/${config.namespaceId}/values/${key}`,
            {
              headers: {
                Authorization: `Bearer ${config.apiToken}`
              }
            }
          );
          return response.text();
        },
        put: async (key: string, value: string) => {
          await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/kv/namespaces/${config.namespaceId}/values/${key}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${config.apiToken}`,
                'Content-Type': 'text/plain'
              },
              body: value
            }
          );
        },
        delete: async (key: string) => {
          await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/kv/namespaces/${config.namespaceId}/values/${key}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${config.apiToken}`
              }
            }
          );
        }
      };
      
      store = new CloudflareKVStore(kv as KVNamespace);
    } else {
      store = new MemoryKVStore();
    }
  } else {
    // Legacy KVNamespace parameter
    console.log('[KVStore] Creating KV store:', {
      hasKV: !!config,
      type: config ? 'CloudflareKVStore' : 'MemoryKVStore'
    });

    if (config && (!(config as KVNamespace).get || !(config as KVNamespace).put || !(config as KVNamespace).delete)) {
      console.error('[KVStore] Invalid KV namespace provided:', config);
      throw new Error('Invalid KV namespace: missing required methods');
    }

    store = config ? new CloudflareKVStore(config as KVNamespace) : new MemoryKVStore();
  }

  console.log('[KVStore] Successfully created store');
  return store;
}
