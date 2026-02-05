type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const DEFAULT_MAX_SIZE = 200;

export class SimpleCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(private ttlMs: number, maxSize?: number) {
    this.maxSize = maxSize ?? DEFAULT_MAX_SIZE;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    // Move to end for LRU ordering (Map preserves insertion order)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T) {
    // If key already exists, delete first so it moves to end
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.store.size >= this.maxSize) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      } else {
        break;
      }
    }

    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
