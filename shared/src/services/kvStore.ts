export interface KVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

// In-memory store for development/testing
class MemoryKVStore implements KVStore {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// Cloudflare KV store implementation
class CloudflareKVStore implements KVStore {
  constructor(private kv: KVNamespace) {}

  async get(key: string): Promise<string | null> {
    return this.kv.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    await this.kv.put(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}

// Factory function to create appropriate store
export function createKVStore(kv?: KVNamespace): KVStore {
  return kv ? new CloudflareKVStore(kv) : new MemoryKVStore();
}
