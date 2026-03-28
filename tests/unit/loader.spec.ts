import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Loader } from '../../src/loader/loader.js';
import { processPage } from '../../src/worker/process-page-task.js';
import type { ProcessPageData } from '../../src/worker/process-page-task.js';
import type { IHttpClient, IWorkerPool, HttpRequest, HttpResponse } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

/** Mock HTTP client that serves fixture pages, terminating at maxPages. */
class FixtureHttpClient implements IHttpClient {
  private pageNum = 0;
  private maxPages: number;

  constructor(maxPages = 39) {
    this.maxPages = maxPages;
  }

  async execute(_request: HttpRequest): Promise<HttpResponse> {
    this.pageNum++;

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

describe('Loader', () => {
  it('loads empty inventory (FR06)', async () => {
    const loader = new Loader(new EmptyHttpClient());
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
    expect(result.inventory).toEqual([]);
  });

  it('loads single page inventory', async () => {
    const loader = new Loader(new FixtureHttpClient(1));
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBeGreaterThan(0);
    expect(result.inventory[0].assetid).toBeTruthy();
    expect(result.inventory[0].name).toBeTruthy();
  });

  it('loads multi-page inventory with pagination', async () => {
    const loader = new Loader(new FixtureHttpClient(3));
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBeGreaterThan(4000);
  });

  it('cache disabled → always cold load (FR54)', async () => {
    let callCount = 0;
    const http: IHttpClient = {
      execute: async () => {
        callCount++;
        return {
          status: 200,
          data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
          headers: {},
        };
      },
      destroy: () => {},
    };

    const loader = new Loader(http);
    await loader.load('123', 753, 6, { cache: false, requestDelay: 0 });
    await loader.load('123', 753, 6, { cache: false, requestDelay: 0 });
    expect(callCount).toBe(2);
  });

  it('never throws — always returns { success: false } (FR24)', async () => {
    const http: IHttpClient = {
      execute: async () => { throw new Error('Connection refused'); },
      destroy: () => {},
    };

    const loader = new Loader(http);
    const result = await loader.load('123', 753, 6, {
      cache: false, requestDelay: 0, maxRetries: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('network_error');
    expect(result.error?.message).toBe('Connection refused');
  });

  it('no worker pool injected → unchanged behavior (regression)', async () => {
    const loader = new Loader(new FixtureHttpClient(3));
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0,
    });
    expect(result.success).toBe(true);
    expect(result.count).toBeGreaterThan(4000);
  });

  it('shared cache: two Loader instances share cache when given same instance', async () => {
    let callCount = 0;
    const http: IHttpClient = {
      execute: async () => {
        callCount++;
        return {
          status: 200,
          data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
          headers: {},
        };
      },
      destroy: () => {},
    };

    const store = new Map<string, any>();
    const shared = {
      get: (k: string) => store.get(k),
      set: (k: string, v: any) => { store.set(k, v); },
      has: (k: string) => store.has(k),
      delete: (k: string) => store.delete(k),
    };

    const loader1 = new Loader(http, shared);
    const loader2 = new Loader(http, shared);

    await loader1.load('shared-test', 753, 6, { cache: true, requestDelay: 0 });
    await loader2.load('shared-test', 753, 6, { cache: true, requestDelay: 0 });

    expect(callCount).toBe(1);
  });
});

/** Mock worker pool that delegates to the real processPage function. */
class MockWorkerPool implements IWorkerPool {
  calls: { task: string; data: unknown }[] = [];

  async run<T>(task: string, data: unknown): Promise<T> {
    this.calls.push({ task, data });
    return processPage(data as ProcessPageData) as T;
  }

  async destroy(): Promise<void> {}
}

/** Mock worker pool that always fails. */
class FailingWorkerPool implements IWorkerPool {
  async run<T>(): Promise<T> {
    throw new Error('Worker crashed');
  }
  async destroy(): Promise<void> {}
}

describe('Loader — adaptive workers (FR58-FR61)', () => {
  it('small inventory (<5000 items): worker pool run is never called', async () => {
    const pool = new MockWorkerPool();
    const loader = new Loader(new FixtureHttpClient(1), undefined, pool);

    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0,
    });

    expect(result.success).toBe(true);
    expect(pool.calls.length).toBe(0);
  });

  it('large inventory but single load (activeLoads=1): worker not used', async () => {
    const pool = new MockWorkerPool();
    const loader = new Loader(new FixtureHttpClient(39), undefined, pool);

    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBeGreaterThan(70000);
    // activeLoads=1 < threshold(3), so no worker calls
    expect(pool.calls.length).toBe(0);
  });

  it('large inventory + 3 concurrent loads: worker IS used for pages 2+', async () => {
    const pools: MockWorkerPool[] = [];
    const loaders: Loader[] = [];

    for (let i = 0; i < 3; i++) {
      const pool = new MockWorkerPool();
      pools.push(pool);
      loaders.push(new Loader(new FixtureHttpClient(39), undefined, pool));
    }

    // Launch all 3 loads concurrently
    const results = await Promise.all(
      loaders.map(l => l.load('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0, tradableOnly: false,
      })),
    );

    for (const result of results) {
      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(70000);
    }

    // At least some loaders should have used workers (pages 2-39 = 38 worker calls each)
    const totalWorkerCalls = pools.reduce((sum, p) => sum + p.calls.length, 0);
    expect(totalWorkerCalls).toBeGreaterThan(0);
  });

  it('page 1 always processed on main thread even with workers active', async () => {
    // We verify by checking that worker calls are always for pages 2+
    // (page 1 has no previousDescriptions — worker calls always have them)
    const pools: MockWorkerPool[] = [];
    const loaders: Loader[] = [];

    for (let i = 0; i < 3; i++) {
      const pool = new MockWorkerPool();
      pools.push(pool);
      loaders.push(new Loader(new FixtureHttpClient(39), undefined, pool));
    }

    await Promise.all(
      loaders.map(l => l.load('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0, tradableOnly: false,
      })),
    );

    // All worker calls should have non-empty previousDescriptions (pages 2+)
    for (const pool of pools) {
      for (const call of pool.calls) {
        const data = call.data as ProcessPageData;
        expect(data.previousDescriptions.length).toBeGreaterThan(0);
      }
    }
  });

  it('worker failure: graceful fallback to main thread', async () => {
    const pool = new FailingWorkerPool();

    // We need 3 concurrent loads to trigger worker usage
    const loaders = Array.from({ length: 3 }, () =>
      new Loader(new FixtureHttpClient(39), undefined, pool),
    );

    const results = await Promise.all(
      loaders.map(l => l.load('76561198356905764', 753, 6, {
        cache: false, requestDelay: 0, tradableOnly: false,
      })),
    );

    // All should succeed despite worker failures — fell back to main thread
    for (const result of results) {
      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(70000);
    }
  });

  it('maxWorkers config creates auto-pool and cleans up after load', async () => {
    // Small inventory — workers won't trigger (below threshold),
    // but auto-pool creation/cleanup is exercised
    const loader = new Loader(new FixtureHttpClient(1));

    // Before load: no pool
    expect((loader as any).workerPool).toBeNull();

    await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, maxWorkers: 2,
    });

    // After load: auto-pool destroyed, workerPool reset to null
    expect((loader as any).workerPool).toBeNull();
  });

  it('maxWorkers config does not override constructor-injected pool', async () => {
    const pool = new MockWorkerPool();
    const loader = new Loader(new FixtureHttpClient(1), undefined, pool);

    await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, maxWorkers: 4,
    });

    // Constructor pool should remain — maxWorkers config ignored
    expect((loader as any).workerPool).toBe(pool);
  });

  it('activeLoads counter: increments and decrements correctly', async () => {
    // Reset to known state
    const initial = Loader.activeLoads;

    const http: IHttpClient = {
      execute: async () => {
        // During execution, activeLoads should be > initial
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
    await loader.load('123', 753, 6, { cache: false, requestDelay: 0 });

    // After completion, should be back to initial
    expect(Loader.activeLoads).toBe(initial);
  });
});
