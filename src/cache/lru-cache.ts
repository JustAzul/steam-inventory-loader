import { LRUCache } from 'lru-cache';
import type { ICacheStore } from '../types.js';

export interface LruCacheOptions {
  /** Max number of entries. Default: 20. */
  max?: number;
  /** TTL in milliseconds. Default: 30_000 (30s). */
  ttl?: number;
  /** Max total size in bytes (estimated). Default: 512MB. Prevents heap blowup. */
  maxSize?: number;
}

/**
 * Estimated heap bytes per cached inventory item.
 * Derived from live benchmarks: 77k items = ~63.5MB heap ≈ 824 bytes/item.
 * Using 1000 as conservative estimate (accounts for tags, descriptions, etc).
 */
const ESTIMATED_BYTES_PER_ITEM = 1000;

/**
 * Default max cache size: 512MB.
 * Prevents worst-case scenarios (20 × 77k inventories = 5.8GB).
 * With 512MB cap, the cache holds ~6-7 large inventories or ~250 typical ones.
 */
const DEFAULT_MAX_SIZE = 512 * 1024 * 1024;

/**
 * LRU cache store wrapping lru-cache v10.
 * Implements ICacheStore<K,V> — pluggable, consumers can swap for Redis/SQLite.
 *
 * Uses size-aware eviction: each entry's size is estimated from its item count,
 * so one 77k inventory (~63MB) counts more toward the limit than twenty 2k
 * inventories (~1.6MB each). This prevents large inventories from starving
 * the cache of smaller ones.
 */
export class LruCacheStore<K extends string | number, V extends object> implements ICacheStore<K, V> {
  private cache: LRUCache<K, V>;

  constructor(options: LruCacheOptions = {}) {
    this.cache = new LRUCache<K, V>({
      max: options.max ?? 20,
      ttl: options.ttl ?? 30_000,
      maxSize: options.maxSize ?? DEFAULT_MAX_SIZE,
      sizeCalculation: (value: V) => {
        // Estimate size from inventory item count
        const asInventory = value as unknown as { count?: number; inventory?: unknown[] };
        const itemCount = asInventory.count ?? asInventory.inventory?.length ?? 1;
        return itemCount * ESTIMATED_BYTES_PER_ITEM;
      },
    });
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V): void {
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}
