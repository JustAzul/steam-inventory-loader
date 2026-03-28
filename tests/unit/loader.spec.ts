import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Loader } from '../../src/loader/loader.js';
import type { IHttpClient, HttpRequest, HttpResponse } from '../../src/types.js';

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
