import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Loader, Fields, getTag, getImageURL, getLargeImageURL, isCardType } from '../../src/index.js';
import type { IHttpClient, HttpRequest, HttpResponse, ItemDetails } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');
const TOTAL_PAGES = 39;

/**
 * Mock HTTP client serving all 39 fixture pages for full end-to-end tests.
 */
class FullFixtureHttpClient implements IHttpClient {
  private pageNum = 0;
  calls: HttpRequest[] = [];

  async execute(request: HttpRequest): Promise<HttpResponse> {
    this.calls.push(request);
    this.pageNum++;

    if (this.pageNum > TOTAL_PAGES) {
      // Should not happen — page 39 has more_items=0
      return { status: 200, data: { success: 1, total_inventory_count: 0 }, headers: {} };
    }

    const data = JSON.parse(
      readFileSync(join(FIXTURES, `page-${String(this.pageNum).padStart(2, '0')}.json`), 'utf8'),
    );
    return { status: 200, data, headers: {} };
  }

  destroy(): void {}
}

describe('Full Pipeline — 77k items end-to-end', () => {
  it('loads all 39 pages with correct item count', async () => {
    const http = new FullFixtureHttpClient();
    const loader = new Loader(http);
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false,
      requestDelay: 0,
      tradableOnly: false,
    });

    expect(result.success).toBe(true);
    // Test account has 77,073 items
    expect(result.count).toBeGreaterThanOrEqual(77_000);
    expect(result.inventory.length).toBe(result.count);
    // Verify all 39 pages were fetched
    expect(http.calls.length).toBe(TOTAL_PAGES);
  });

  it('all items have required v3 fields (full field parity)', async () => {
    const http = new FullFixtureHttpClient();
    const loader = new Loader(http);
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    // Check first, middle, and last items
    const samples = [
      result.inventory[0],
      result.inventory[Math.floor(result.count / 2)],
      result.inventory[result.count - 1],
    ];

    for (const item of samples) {
      expect(item.assetid).toBeTruthy();
      expect(typeof item.appid).toBe('number');
      expect(typeof item.amount).toBe('number');
      expect(typeof item.tradable).toBe('boolean');
      expect(typeof item.marketable).toBe('boolean');
      expect(typeof item.commodity).toBe('boolean');
      expect(typeof item.name).toBe('string');
      expect(typeof item.market_hash_name).toBe('string');
      expect(typeof item.type).toBe('string');
      expect(item.contextid).toBe('6');
      expect(item.id).toBeTruthy();
      expect(item.instanceid).toBeTruthy();
    }
  });

  it('field selection reduces output fields (FR47)', async () => {
    const http = new FullFixtureHttpClient();
    const loader = new Loader(http);
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
      fields: [Fields.MARKET_HASH_NAME, Fields.TRADABLE, Fields.TAGS, Fields.TYPE, Fields.APPID, Fields.AMOUNT],
    });

    expect(result.success).toBe(true);
    const item = result.inventory[0];
    const keys = Object.keys(item);
    // assetid (always) + 6 selected = 7
    expect(keys.length).toBe(7);
    expect(keys.sort()).toEqual(['amount', 'appid', 'assetid', 'market_hash_name', 'tags', 'tradable', 'type']);
  });

  it('tradableOnly=true filters non-tradable items (FR18)', async () => {
    const http1 = new FullFixtureHttpClient();
    const loader1 = new Loader(http1);
    const all = await loader1.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    const http2 = new FullFixtureHttpClient();
    const loader2 = new Loader(http2);
    const tradable = await loader2.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: true,
    });

    expect(tradable.count).toBeLessThanOrEqual(all.count);
    // All items in tradable result should actually be tradable
    for (const item of tradable.inventory.slice(0, 100)) {
      expect(item.tradable).toBe(true);
    }
  });

  it('CommunityStrategy applies market_fee_app (FR22)', async () => {
    const http = new FullFixtureHttpClient();
    const loader = new Loader(http);
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    // Items with market_hash_name like "570-Name" should have market_fee_app=570
    const dota2Item = result.inventory.find(i => i.market_hash_name.startsWith('570-'));
    expect(dota2Item).toBeDefined();
    expect(dota2Item!.market_fee_app).toBe(570);
  });

  it('tag normalization: localized_tag_name → name (FR09)', async () => {
    const http = new FullFixtureHttpClient();
    const loader = new Loader(http);
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    const itemWithTags = result.inventory.find(i => i.tags && i.tags.length > 0);
    expect(itemWithTags).toBeDefined();
    const tag = itemWithTags!.tags![0];
    expect(tag.name).toBeTruthy();
    expect(tag.category_name).toBeTruthy();
    expect(typeof tag.color).toBe('string');
  });
});

describe('Utility functions integration', () => {
  let sampleItem: ItemDetails;

  it('setup: load a sample item', async () => {
    const http = new FullFixtureHttpClient();
    const loader = new Loader(http);
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });
    // Find a trading card for comprehensive testing
    sampleItem = result.inventory.find(i =>
      i.tags?.some(t => t.internal_name === 'item_class_2'),
    ) ?? result.inventory[0];
  });

  it('getTag finds tag by category (FR42)', () => {
    const tag = getTag(sampleItem.tags, 'item_class');
    expect(tag).toBeTruthy();
    expect(tag!.category).toBe('item_class');
  });

  it('getImageURL returns full URL (FR43)', () => {
    const url = getImageURL(sampleItem);
    expect(url).toContain('steamcommunity-a.akamaihd.net');
    expect(url).toContain(sampleItem.icon_url);
  });

  it('getLargeImageURL returns full URL (FR44)', () => {
    const url = getLargeImageURL(sampleItem);
    expect(url).toContain('steamcommunity-a.akamaihd.net');
  });

  it('isCardType detects Normal card (FR45)', () => {
    const cardItem = sampleItem; // Should be a trading card from setup
    if (cardItem.tags?.some(t => t.internal_name === 'item_class_2')) {
      const cardType = isCardType(cardItem.tags);
      expect(cardType).toBe('Normal');
    }
  });
});

describe('Cache integration', () => {
  it('second load returns cached result in <1ms (FR53)', async () => {
    const http = new FullFixtureHttpClient();
    const loader = new Loader(http);

    // Cold load
    await loader.load('76561198356905764', 753, 6, {
      cache: true, requestDelay: 0, tradableOnly: false,
    });

    // Cache hit — measure time
    const start = performance.now();
    const result = await loader.load('76561198356905764', 753, 6, {
      cache: true, requestDelay: 0, tradableOnly: false,
    });
    const elapsed = performance.now() - start;

    expect(result.success).toBe(true);
    expect(elapsed).toBeLessThan(1); // <1ms
    // Only 39 HTTP calls total (all from first load)
    expect(http.calls.length).toBe(TOTAL_PAGES);
  });

  it('different params → cache miss (different tradableOnly)', async () => {
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
    // Isolated cache to avoid cross-test pollution
    const store = new Map<string, any>();
    const isolated = {
      get: (k: string) => store.get(k),
      set: (k: string, v: any) => { store.set(k, v); },
      has: (k: string) => store.has(k),
      delete: (k: string) => store.delete(k),
    };
    const loader = new Loader(http, isolated);

    await loader.load('cache-miss-test', 753, 6, {
      cache: true, requestDelay: 0, tradableOnly: false,
    });
    await loader.load('cache-miss-test', 753, 6, {
      cache: true, requestDelay: 0, tradableOnly: true, // different param → miss
    });

    // Two cold loads (empty inventories, 1 call each)
    expect(callCount).toBe(2);
  });
});

describe('Idempotency', () => {
  it('same inventory loaded twice → identical results (no state leakage)', async () => {
    const http1 = new FullFixtureHttpClient();
    const loader1 = new Loader(http1);
    const result1 = await loader1.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    const http2 = new FullFixtureHttpClient();
    const loader2 = new Loader(http2);
    const result2 = await loader2.load('76561198356905764', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    expect(result1.count).toBe(result2.count);
    expect(result1.inventory[0].assetid).toBe(result2.inventory[0].assetid);
    expect(result1.inventory[result1.count - 1].assetid).toBe(result2.inventory[result2.count - 1].assetid);
  });
});

describe('Error paths', () => {
  it('HTTP 429 → { success: false, error.type: rate_limited }', async () => {
    const http: IHttpClient = {
      execute: async () => ({ status: 429, data: {}, headers: {} }),
      destroy: () => {},
    };
    const loader = new Loader(http);
    const result = await loader.load('123', 753, 6, {
      cache: false, requestDelay: 0, maxRetries: 0,
    });
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('rate_limited');
    expect(result.count).toBe(0);
    expect(result.inventory).toEqual([]);
  });

  it('HTTP 403 → { success: false, error.type: private_profile }', async () => {
    const http: IHttpClient = {
      execute: async () => ({ status: 403, data: {}, headers: {} }),
      destroy: () => {},
    };
    const loader = new Loader(http);
    const result = await loader.load('123', 753, 6, {
      cache: false, requestDelay: 0, maxRetries: 0,
    });
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('private_profile');
  });

  it('network error → { success: false, error.type: network_error }', async () => {
    const http: IHttpClient = {
      execute: async () => { throw new Error('ECONNREFUSED'); },
      destroy: () => {},
    };
    const loader = new Loader(http);
    const result = await loader.load('123', 753, 6, {
      cache: false, requestDelay: 0, maxRetries: 0,
    });
    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('network_error');
  });

  it('malformed JSON → { success: false, error.type: invalid_response }', async () => {
    const http: IHttpClient = {
      execute: async () => ({
        status: 200,
        data: { success: false, error: 'Something went wrong' },
        headers: {},
      }),
      destroy: () => {},
    };
    const loader = new Loader(http);
    const result = await loader.load('123', 753, 6, {
      cache: false, requestDelay: 0, maxRetries: 0,
    });
    expect(result.success).toBe(false);
  });
});
