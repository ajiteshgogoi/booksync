class InMemoryStore {
  private store: Map<string, any>;

  constructor() {
    this.store = new Map();
  }

  get(key: string): any | undefined {
    return this.store.get(key);
  }

  set(key: string, value: any): void {
    this.store.set(key, value);
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getAll(): { [key: string]: any } {
    return Object.fromEntries(this.store.entries());
  }
}

export { InMemoryStore };
