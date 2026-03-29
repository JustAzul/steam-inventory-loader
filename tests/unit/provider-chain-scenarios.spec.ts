import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Loader } from '../../src/loader/loader.js';
import type { IHttpClient, HttpRequest, HttpResponse, IInventoryProvider, LoaderConfig, PageRequest, InventoryPage, SteamErrorInfo } from '../../src/types.js';

const FIXTURES = join(import.meta.dirname, '../../fixtures');

/** Builds a mock HTTP that serves fixture pages, optionally failing at a specific page. */
function makeFixtureHttp(opts: {
  maxPages?: number;
  failOnPage?: number;
  failStatus?: number;
  failAfterPages?: number; // fail every request after N pages
} = {}): IHttpClient & { calls: HttpRequest[]; pageNum: number } {
  const state = { calls: [] as HttpRequest[], pageNum: 0 };
  return {
    ...state,
    async execute(req: HttpRequest): Promise<HttpResponse> {
      state.calls.push(req);
      state.pageNum++;

      if (opts.failOnPage && state.pageNum === opts.failOnPage) {
        return { status: opts.failStatus ?? 429, data: {}, headers: {} };
      }
      if (opts.failAfterPages && state.pageNum > opts.failAfterPages) {
        return { status: opts.failStatus ?? 429, data: {}, headers: {} };
      }

      const maxP = opts.maxPages ?? 3;
      const file = `page-${String(Math.min(state.pageNum, maxP)).padStart(2, '0')}.json`;
      const data = JSON.parse(readFileSync(join(FIXTURES, file), 'utf8'));
      if (state.pageNum >= maxP) {
        data.more_items = 0;
        delete data.last_assetid;
      }
      return { status: 200, data, headers: {} };
    },
    destroy() {},
  };
}

describe('Provider Chain Scenarios', () => {
  beforeEach(() => Loader.resetRateLimiters());

  it('fallback on rate limit: Community 429 → SteamApis succeeds', async () => {
    let reqCount = 0;
    const http: IHttpClient = {
      async execute(req: HttpRequest): Promise<HttpResponse> {
        reqCount++;
        // First request (Community) → 429
        if (reqCount === 1) {
          return { status: 429, data: {}, headers: {} };
        }
        // Second+ requests (SteamApis fallback) → success
        return {
          status: 200,
          data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0, maxRetries: 0,
      steamApisKey: 'test-key',
      endpointPriority: ['community', 'steamApis'],
    });

    expect(result.success).toBe(true);
    expect(reqCount).toBe(2); // 1 failed Community + 1 successful SteamApis
  });

  it('no fallback on auth error: 401 does NOT try next provider', async () => {
    let reqCount = 0;
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        reqCount++;
        return { status: 401, data: {}, headers: {} };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0, maxRetries: 0,
      steamApisKey: 'test-key',
      endpointPriority: ['community', 'steamApis'],
    });

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('auth_failed');
    // Should NOT have tried SteamApis — auth errors aren't retryable
    expect(reqCount).toBe(1);
  });

  it('all providers exhausted → rate_limited error', async () => {
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        return { status: 429, data: {}, headers: {} };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0, maxRetries: 0,
      steamApisKey: 'key',
      endpointPriority: ['community', 'steamApis'],
    });

    expect(result.success).toBe(false);
    expect(result.error?.type).toBe('rate_limited');
  });

  it('warns when endpointPriority produces empty chain before falling back (M4)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        return {
          status: 200,
          data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0,
      endpointPriority: ['steamApis'], // no key → unavailable
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('steamApis'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Falling back to community'),
    );
    warnSpy.mockRestore();
  });

  it('all priority providers unavailable → fallback to community', async () => {
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        return {
          status: 200,
          data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0,
      // steamApis in priority but no key → unavailable → falls back to community
      endpointPriority: ['steamApis'],
    });

    expect(result.success).toBe(true);
  });

  it('custom endpoint clears API keys (FR05)', async () => {
    const calls: HttpRequest[] = [];
    const http: IHttpClient = {
      async execute(req: HttpRequest): Promise<HttpResponse> {
        calls.push(req);
        return {
          status: 200,
          data: { success: 1, total_inventory_count: 0, assets: [], descriptions: [] },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0,
      customEndpoint: 'https://my.proxy.com',
      steamApisKey: 'should-be-cleared',
    });

    // URL should be custom endpoint, NOT steamapis
    expect(calls[0].url).toContain('my.proxy.com');
    expect(calls[0].url).not.toContain('steamapis');
    // No api_key param
    expect(calls[0].params?.api_key).toBeUndefined();
  });

  it('paid API forces requestDelay=0 when not explicitly set (FR38)', async () => {
    // This is tested via config normalization, but verify end-to-end
    // The config normalizer sets delay=0 for paid APIs
    const { normalizeConfig } = await import('../../src/loader/config.js');
    const config = normalizeConfig('76561198000000123', 753, 6, { steamApisKey: 'key' });
    expect(config.requestDelay).toBe(0);

    // But explicit delay is preserved
    const config2 = normalizeConfig('76561198000000123', 753, 6, { steamApisKey: 'key', requestDelay: 2000 });
    expect(config2.requestDelay).toBe(2000);
  });
});

describe('Long-term Resilience', () => {
  beforeEach(() => Loader.resetRateLimiters());

  it('handles unknown fields in API response gracefully', async () => {
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        return {
          status: 200,
          data: {
            success: 1,
            total_inventory_count: 1,
            assets: [{
              appid: 753, contextid: '6', assetid: '1', classid: '1',
              instanceid: '0', amount: '1',
              new_unknown_field: 'should not crash',
            }],
            descriptions: [{
              appid: 753, classid: '1', instanceid: '0',
              tradable: 1, name: 'Test', type: 'Test',
              future_field_2027: true,
              another_new_thing: { nested: 'data' },
            }],
            new_top_level_field: 'ignored',
          },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    // Unknown fields don't crash, known fields are correct
    expect(result.inventory[0].name).toBe('Test');
  });

  it('handles empty tags array (Steam sometimes sends [])', async () => {
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        return {
          status: 200,
          data: {
            success: 1, total_inventory_count: 1,
            assets: [{ appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '1' }],
            descriptions: [{ appid: 753, classid: '1', instanceid: '0', tradable: 1, name: 'Test', type: 'Test', tags: [] }],
          },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    expect(result.success).toBe(true);
    expect(result.inventory[0].tags).toEqual([]);
  });

  it('handles tags with mixed old+new format (transition period)', async () => {
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        return {
          status: 200,
          data: {
            success: 1, total_inventory_count: 1,
            assets: [{ appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '1' }],
            descriptions: [{
              appid: 753, classid: '1', instanceid: '0', tradable: 1, name: 'Test', type: 'Test',
              tags: [
                // New format (localized_*)
                { category: 'droprate', internal_name: 'droprate_0', localized_category_name: 'Rarity', localized_tag_name: 'Common' },
                // Old format (name, category_name) — might appear during API transitions
                { category: 'Game', internal_name: 'app_730', name: 'CS2', category_name: 'Game', color: '#FF0000' },
              ],
            }],
          },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    // New format: localized_tag_name → name
    expect(result.inventory[0].tags![0].name).toBe('Common');
    // Old format: falls back to name when no localized_tag_name
    expect(result.inventory[0].tags![1].name).toBe('CS2');
    expect(result.inventory[0].tags![1].color).toBe('#FF0000');
  });

  it('handles very large amount values (gem stacks)', async () => {
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        return {
          status: 200,
          data: {
            success: 1, total_inventory_count: 1,
            assets: [{ appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '999999' }],
            descriptions: [{ appid: 753, classid: '1', instanceid: '0', tradable: 1, name: 'Gems', type: 'Steam Gems' }],
          },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    expect(result.inventory[0].amount).toBe(999999);
    expect(typeof result.inventory[0].amount).toBe('number');
  });

  it('handles description with all optional fields missing', async () => {
    const http: IHttpClient = {
      async execute(): Promise<HttpResponse> {
        return {
          status: 200,
          data: {
            success: 1, total_inventory_count: 1,
            assets: [{ appid: 753, contextid: '6', assetid: '1', classid: '1', instanceid: '0', amount: '1' }],
            // Minimal description — only required fields
            descriptions: [{ appid: 753, classid: '1', instanceid: '0' }],
          },
          headers: {},
        };
      },
      destroy() {},
    };

    const loader = new Loader(http);
    const result = await loader.load('76561198000000123', 753, 6, {
      cache: false, requestDelay: 0, tradableOnly: false,
    });

    expect(result.success).toBe(true);
    const item = result.inventory[0];
    expect(item.name).toBe('');
    expect(item.tradable).toBe(false);
    expect(item.marketable).toBe(false);
    expect(item.icon_url).toBe('');
    expect(item.tags).toBeUndefined();
  });

  it('Steam.Supply 401 classified as private_profile (not auth_failed)', async () => {
    // Steam.Supply docs: 401 = "inventory hidden or invalid API key"
    const { SteamSupplyProvider } = await import('../../src/providers/steam-supply.js');
    const provider = new SteamSupplyProvider();
    const err = provider.classifyError(401, {});
    expect(err.type).toBe('private_profile');
    expect(err.message).toContain('hidden');
  });

  it('HTTP 5xx treated as bad_status (server errors)', async () => {
    for (const status of [500, 502, 503, 504]) {
      const http: IHttpClient = {
        async execute(): Promise<HttpResponse> {
          return { status, data: {}, headers: {} };
        },
        destroy() {},
      };

      const loader = new Loader(http);
      const result = await loader.load('76561198000000123', 753, 6, {
        cache: false, requestDelay: 0, maxRetries: 0,
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('bad_status');
    }
  });
});
