import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Loader } from '../../src/loader/loader.js';
import { Fields } from '../../src/types.js';
import { processPage } from '../../src/worker/process-page-task.js';
import type { ProcessPageData } from '../../src/worker/process-page-task.js';
import type { IHttpClient, IWorkerPool, HttpRequest, HttpResponse, ItemDetails } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

/** Collect all batches from an async generator. */
async function collectBatches(gen: AsyncGenerator<ItemDetails[]>): Promise<ItemDetails[][]> {
  const batches: ItemDetails[][] = [];
  for await (const batch of gen) batches.push(batch);
  return batches;
}

/** Mock HTTP client that serves fixture pages, terminating at maxPages. */
class FixtureHttpClient implements IHttpClient {
  private pageNum = 0;
  callCount = 0;

  constructor(private maxPages = 39) {}

  async execute(_request: HttpRequest): Promise<HttpResponse> {
    this.pageNum++;
    this.callCount++;

    const pageFile = `page-${String(Math.min(this.pageNum, this.maxPages)).padStart(2, '0')}.json`;
    const data = JSON.parse(readFileSync(join(FIXTURES, pageFile), 'utf8'));

    if (this.pageNum >= this.maxPages) {
      data.more_items = 0;
      delete data.last_assetid;
    }

    return { status: 200, data, headers: {} };
  }

  destroy(): void {}
}

/** Mock HTTP client returning empty inventory. */
class EmptyHttpClient implements IHttpClient {
  async execute(): Promise<HttpResponse> {
    return {
      status: 200,
      data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
      headers: {},
    };
  }
  destroy(): void {}
}

/** Mock HTTP client that fails on a specific page. */
class FailOnPageHttpClient implements IHttpClient {
  private pageNum = 0;

  constructor(private failOnPage: number, private maxPages = 39) {}

  async execute(_request: HttpRequest): Promise<HttpResponse> {
    this.pageNum++;

    if (this.pageNum === this.failOnPage) {
      return { status: 429, data: {}, headers: {} };
    }

    const pageFile = `page-${String(Math.min(this.pageNum, this.maxPages)).padStart(2, '0')}.json`;
    const data = JSON.parse(readFileSync(join(FIXTURES, pageFile), 'utf8'));

    if (this.pageNum >= this.maxPages) {
      data.more_items = 0;
      delete data.last_assetid;
    }

    return { status: 200, data, headers: {} };
  }

  destroy(): void {}
}

/** Mock HTTP client that returns rate limit then succeeds (for fallback testing). */
class RateLimitThenSucceedHttpClient implements IHttpClient {
  private callCount = 0;

  constructor(private maxPages = 1) {}

  async execute(_request: HttpRequest): Promise<HttpResponse> {
    this.callCount++;

    // First call: rate limit
    if (this.callCount === 1) {
      return { status: 429, data: {}, headers: {} };
    }

    // After fallback, serve fixture pages
    const pageNum = this.callCount - 1;
    const pageFile = `page-${String(Math.min(pageNum, this.maxPages)).padStart(2, '0')}.json`;
    const data = JSON.parse(readFileSync(join(FIXTURES, pageFile), 'utf8'));

    if (pageNum >= this.maxPages) {
      data.more_items = 0;
      delete data.last_assetid;
    }

    return { status: 200, data, headers: {} };
  }

  destroy(): void {}
}

/** Mock worker pool that delegates to the real processPage function. */
class MockWorkerPool implements IWorkerPool {
  calls: { task: string; data: unknown }[] = [];

  async run<T>(task: string, data: unknown): Promise<T> {
    this.calls.push({ task, data });
    return processPage(data as ProcessPageData) as T;
  }

  async destroy(): Promise<void> {}
}

describe('loadStream', () => {
  beforeEach(() => Loader.resetRateLimiters());

  it('empty inventory yields nothing', async () => {
    const loader = new Loader(new EmptyHttpClient());
    const batches = await collectBatches(
      loader.loadStream('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0,
      }),
    );

    expect(batches).toHaveLength(0);
  });

  it('single-page yields one batch', async () => {
    const loader = new Loader(new FixtureHttpClient(1));
    const batches = await collectBatches(
      loader.loadStream('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0,
      }),
    );

    expect(batches).toHaveLength(1);
    expect(batches[0].length).toBeGreaterThan(0);
    expect(batches[0][0].assetid).toBeTruthy();
  });

  it('multi-page yields one batch per page', async () => {
    const pages = 5;
    const loader = new Loader(new FixtureHttpClient(pages));
    const batches = await collectBatches(
      loader.loadStream('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0,
      }),
    );

    expect(batches).toHaveLength(pages);
    for (const batch of batches) {
      expect(batch.length).toBeGreaterThan(0);
    }
  });

  it('item count matches load()', async () => {
    const http1 = new FixtureHttpClient(5);
    const loader1 = new Loader(http1);
    const loadResult = await loader1.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    const http2 = new FixtureHttpClient(5);
    const loader2 = new Loader(http2);
    const batches = await collectBatches(
      loader2.loadStream('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0, tradableOnly: false,
      }),
    );

    const streamTotal = batches.reduce((sum, b) => sum + b.length, 0);
    expect(streamTotal).toBe(loadResult.count);
  });

  it('cache hit yields full inventory as single batch', async () => {
    const store = new Map<string, any>();
    const cache = {
      get: (k: string) => store.get(k),
      set: (k: string, v: any) => { store.set(k, v); },
      has: (k: string) => store.has(k),
      delete: (k: string) => store.delete(k),
    };

    // Cold load to populate cache
    const http1 = new FixtureHttpClient(3);
    const loader1 = new Loader(http1, cache);
    await loader1.load('cache-test', 753, 6, {
      cache: true, requestDelay: 0, tradableOnly: false,
    });

    // Stream should hit cache
    const http2 = new FixtureHttpClient(3);
    const loader2 = new Loader(http2, cache);
    const batches = await collectBatches(
      loader2.loadStream('cache-test', 753, 6, {
        cache: true, requestDelay: 0, tradableOnly: false,
      }),
    );

    expect(batches).toHaveLength(1); // Single batch from cache
    expect(http2.callCount).toBe(0); // No HTTP calls
  });

  it('does NOT write to cache', async () => {
    const store = new Map<string, any>();
    const cache = {
      get: (k: string) => store.get(k),
      set: (k: string, v: any) => { store.set(k, v); },
      has: (k: string) => store.has(k),
      delete: (k: string) => store.delete(k),
    };

    const loader = new Loader(new FixtureHttpClient(1), cache);
    await collectBatches(
      loader.loadStream('no-cache-write', 753, 6, {
        cache: true, requestDelay: 0,
      }),
    );

    expect(store.size).toBe(0);
  });

  it('error mid-stream throws SteamError', async () => {
    const http = new FailOnPageHttpClient(3, 5);
    const loader = new Loader(http);

    const batches: ItemDetails[][] = [];
    await expect(async () => {
      for await (const batch of loader.loadStream('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0, maxRetries: 0,
      })) {
        batches.push(batch);
      }
    }).rejects.toThrow();

    // Should have yielded pages 1-2 before failing on page 3
    expect(batches).toHaveLength(2);
  });

  it('field selection works per batch', async () => {
    const loader = new Loader(new FixtureHttpClient(1));
    const batches = await collectBatches(
      loader.loadStream('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0,
        fields: [Fields.MARKET_HASH_NAME, Fields.TRADABLE],
      }),
    );

    expect(batches).toHaveLength(1);
    const item = batches[0][0];
    // Selected fields present
    expect(item.market_hash_name).toBeTruthy();
    expect(typeof item.tradable).toBe('boolean');
    // assetid always included
    expect(item.assetid).toBeTruthy();
    // Non-selected fields absent
    expect((item as any).icon_url).toBeUndefined();
  });

  it('tradableOnly filtering works', async () => {
    const http1 = new FixtureHttpClient(5);
    const loader1 = new Loader(http1);
    const allBatches = await collectBatches(
      loader1.loadStream('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0, tradableOnly: false,
      }),
    );

    const http2 = new FixtureHttpClient(5);
    const loader2 = new Loader(http2);
    const tradableBatches = await collectBatches(
      loader2.loadStream('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0, tradableOnly: true,
      }),
    );

    const allCount = allBatches.reduce((sum, b) => sum + b.length, 0);
    const tradableCount = tradableBatches.reduce((sum, b) => sum + b.length, 0);

    expect(tradableCount).toBeLessThanOrEqual(allCount);
    for (const batch of tradableBatches) {
      for (const item of batch) {
        expect(item.tradable).toBe(true);
      }
    }
  });

  it('early break cleans up (generator return)', async () => {
    const http = new FixtureHttpClient(39);
    const loader = new Loader(http);

    let batchCount = 0;
    for await (const _batch of loader.loadStream('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0,
    })) {
      batchCount++;
      if (batchCount >= 2) break; // Early exit after 2 pages
    }

    expect(batchCount).toBe(2);
    // HTTP client should have made only ~2-3 calls (not all 39)
    expect(http.callCount).toBeLessThanOrEqual(3);
  });

  it('activeLoads counter: increments during stream, decrements after', async () => {
    const initial = Loader.activeLoads;

    const http: IHttpClient = {
      execute: async () => {
        expect(Loader.activeLoads).toBeGreaterThan(initial);
        return {
          status: 200,
          data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
          headers: {},
        };
      },
      destroy: () => {},
    };

    const loader = new Loader(http);
    await collectBatches(
      loader.loadStream('123', 753, 6, { cache: false, requestDelay: 0 }),
    );

    expect(Loader.activeLoads).toBe(initial);
  });
});

describe('loadStream — adaptive workers', () => {
  beforeEach(() => Loader.resetRateLimiters());

  it('worker offloading yields correct items', async () => {
    const pools: MockWorkerPool[] = [];
    const loaders: Loader[] = [];

    for (let i = 0; i < 3; i++) {
      const pool = new MockWorkerPool();
      pools.push(pool);
      loaders.push(new Loader(new FixtureHttpClient(39), undefined, pool));
    }

    // Launch all 3 streams concurrently
    const allBatches = await Promise.all(
      loaders.map(l => collectBatches(
        l.loadStream('76561198356905764', 753, 6, {
          cache: false, requestDelay: 0, tradableOnly: false,
        }),
      )),
    );

    for (const batches of allBatches) {
      expect(batches).toHaveLength(39);
      const total = batches.reduce((sum, b) => sum + b.length, 0);
      expect(total).toBeGreaterThan(70000);
    }

    // Workers should have been used
    const totalWorkerCalls = pools.reduce((sum, p) => sum + p.calls.length, 0);
    expect(totalWorkerCalls).toBeGreaterThan(0);
  });
});
