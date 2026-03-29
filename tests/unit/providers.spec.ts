import { describe, it, expect, vi } from 'vitest';
import { SteamCommunityProvider } from '../../src/providers/steam-community.js';
import { SteamApisProvider } from '../../src/providers/steam-apis.js';
import { SteamSupplyProvider } from '../../src/providers/steam-supply.js';
import { CustomProvider } from '../../src/providers/custom.js';
import { resolveProviderChain, isCursorCompatible, registerProvider } from '../../src/providers/provider-chain.js';
import type { LoaderConfig, PageRequest, IInventoryProvider, SteamErrorInfo } from '../../src/types.js';

function makeConfig(overrides: Partial<LoaderConfig> = {}): LoaderConfig {
  return {
    steamId: '76561198356905764', appId: 753, contextId: 6,
    language: 'english', tradableOnly: true, itemsPerPage: 2000,
    maxRetries: 3, requestDelay: 4000, cache: true, cacheTTL: 60000,
    cacheMaxEntries: 20, cacheMaxSize: 512 * 1024 * 1024,
    endpointPriority: ['community'], rateLimitCooldown: 30000,
    onWarn: console.warn,
    ...overrides,
  };
}

function makeParams(overrides: Partial<PageRequest> = {}): PageRequest {
  return {
    steamId: '76561198356905764', appId: 753, contextId: 6,
    language: 'english', count: 2000, cursor: null,
    ...overrides,
  };
}

describe('SteamCommunityProvider', () => {
  const provider = new SteamCommunityProvider();

  it('builds correct URL (FR01)', () => {
    const req = provider.buildRequest(makeParams(), makeConfig());
    expect(req.url).toBe('https://steamcommunity.com/inventory/76561198356905764/753/6');
    expect(req.params?.l).toBe('english');
    expect(req.params?.count).toBe(2000);
  });

  it('includes start_assetid when cursor provided', () => {
    const req = provider.buildRequest(makeParams({ cursor: '12345' }), makeConfig());
    expect(req.params?.start_assetid).toBe('12345');
  });

  it('sets Host and Referer headers (FR36)', () => {
    const req = provider.buildRequest(makeParams(), makeConfig());
    expect(req.headers?.Host).toBe('steamcommunity.com');
    expect(req.headers?.Referer).toContain('76561198356905764');
  });

  it('classifies 429 as rate_limited', () => {
    expect(provider.classifyError(429, {}).type).toBe('rate_limited');
  });

  it('classifies 403 as private_profile', () => {
    expect(provider.classifyError(403, {}).type).toBe('private_profile');
  });

  it('shouldFallback only on rate_limited', () => {
    expect(provider.shouldFallback({ type: 'rate_limited', message: '' })).toBe(true);
    expect(provider.shouldFallback({ type: 'auth_failed', message: '' })).toBe(false);
  });

  it('is always available', () => {
    expect(provider.isAvailable(makeConfig())).toBe(true);
  });

  it('method is steam-api', () => {
    expect(provider.method).toBe('steam-api');
  });
});

describe('SteamApisProvider', () => {
  const provider = new SteamApisProvider();

  it('builds correct URL with api_key, language, count (FR03)', () => {
    const req = provider.buildRequest(makeParams(), makeConfig({ steamApisKey: 'mykey' }));
    expect(req.url).toBe('https://api.steamapis.com/steam/inventory/76561198356905764/753/6');
    expect(req.params?.api_key).toBe('mykey');
    expect(req.params?.l).toBe('english');
    expect(req.params?.count).toBe(2000);
  });

  it('is available only when key configured', () => {
    expect(provider.isAvailable(makeConfig())).toBe(false);
    expect(provider.isAvailable(makeConfig({ steamApisKey: 'key' }))).toBe(true);
  });

  it('classifies 402 as insufficient_balance (FR28)', () => {
    expect(provider.classifyError(402, {}).type).toBe('insufficient_balance');
  });

  it('method is steam-api (cursor compatible with community)', () => {
    expect(provider.method).toBe('steam-api');
  });
});

describe('SteamSupplyProvider', () => {
  const provider = new SteamSupplyProvider();

  it('builds correct URL with API key in path, language (FR04)', () => {
    const req = provider.buildRequest(makeParams(), makeConfig({ steamSupplyKey: 'supkey' }));
    expect(req.url).toBe('https://steam.supply/API/supkey/loadinventory');
    expect(req.params?.steamid).toBe('76561198356905764');
    expect(req.params?.count).toBe(5000); // FR39
    expect(req.params?.l).toBe('english');
  });

  it('always uses count=5000 (FR39)', () => {
    const req = provider.buildRequest(makeParams({ count: 100 }), makeConfig({ steamSupplyKey: 'k' }));
    expect(req.params?.count).toBe(5000);
  });

  it('403 message mentions steam.supply api key (FR26)', () => {
    const err = provider.classifyError(403, {});
    expect(err.message).toContain('steam.supply');
  });

  it('method is steam-supply (NOT cursor compatible with steam-api)', () => {
    expect(provider.method).toBe('steam-supply');
  });
});

describe('CustomProvider', () => {
  const provider = new CustomProvider();

  it('appends /{steamID}/{appID}/{contextID} to custom endpoint (FR05)', () => {
    const req = provider.buildRequest(makeParams(), makeConfig({ customEndpoint: 'https://my.api.com' }));
    expect(req.url).toBe('https://my.api.com/76561198356905764/753/6');
  });

  it('is available only when customEndpoint set', () => {
    expect(provider.isAvailable(makeConfig())).toBe(false);
    expect(provider.isAvailable(makeConfig({ customEndpoint: 'https://x.com' }))).toBe(true);
  });

  it('warns when customHeaders contains dangerous headers', () => {
    const onWarn = vi.fn();
    provider.buildRequest(makeParams(), makeConfig({
      customEndpoint: 'https://my.api.com',
      customHeaders: { Host: 'evil.com', 'X-Custom': 'safe' },
      onWarn,
    }));
    expect(onWarn).toHaveBeenCalledOnce();
    expect(onWarn.mock.calls[0][0]).toContain('Host');
  });

  it('does not warn when customHeaders has no dangerous headers', () => {
    const onWarn = vi.fn();
    provider.buildRequest(makeParams(), makeConfig({
      customEndpoint: 'https://my.api.com',
      customHeaders: { 'X-Api-Key': 'abc' },
      onWarn,
    }));
    expect(onWarn).not.toHaveBeenCalled();
  });
});

describe('ProviderChain', () => {
  it('default chain is community only', () => {
    const chain = resolveProviderChain(makeConfig());
    expect(chain.length).toBe(1);
    expect(chain[0].name).toBe('community');
  });

  it('respects endpointPriority order (FR66)', () => {
    const chain = resolveProviderChain(makeConfig({
      endpointPriority: ['steamApis', 'community'],
      steamApisKey: 'key',
    }));
    expect(chain[0].name).toBe('steamApis');
    expect(chain[1].name).toBe('community');
  });

  it('filters unavailable providers', () => {
    const chain = resolveProviderChain(makeConfig({
      endpointPriority: ['steamApis', 'community'],
      // No steamApisKey → steamApis unavailable
    }));
    expect(chain.length).toBe(1);
    expect(chain[0].name).toBe('community');
  });

  it('empty priority falls back to community', () => {
    const chain = resolveProviderChain(makeConfig({ endpointPriority: [] }));
    expect(chain.length).toBe(1);
    expect(chain[0].name).toBe('community');
  });

  it('unknown provider in priority is skipped', () => {
    const chain = resolveProviderChain(makeConfig({
      endpointPriority: ['nonexistent', 'community'],
    }));
    expect(chain.length).toBe(1);
    expect(chain[0].name).toBe('community');
  });

  it('cursor compatibility: community ↔ steamApis (same method)', () => {
    const community = new SteamCommunityProvider();
    const steamApis = new SteamApisProvider();
    expect(isCursorCompatible(community, steamApis)).toBe(true);
  });

  it('cursor incompatibility: community ↔ steamSupply (different method)', () => {
    const community = new SteamCommunityProvider();
    const supply = new SteamSupplyProvider();
    expect(isCursorCompatible(community, supply)).toBe(false);
  });

  it('custom provider registered and usable in chain (FR67)', () => {
    const custom: IInventoryProvider = {
      name: 'myApi',
      method: 'steam-api',
      isAvailable: () => true,
      buildRequest: () => ({ method: 'GET', url: 'https://my.api.com' }),
      parseResponse: () => ({
        success: true, assets: [], descriptions: [],
        moreItems: false, lastAssetId: null, totalInventoryCount: 0,
        error: null, eresult: null, fakeRedirect: false,
      }),
      getNextCursor: () => null,
      classifyError: () => ({ type: 'bad_status', message: 'error' }),
      shouldFallback: () => false,
    };
    registerProvider('myApi', custom);

    const chain = resolveProviderChain(makeConfig({
      endpointPriority: ['myApi', 'community'],
    }));
    expect(chain[0].name).toBe('myApi');
  });
});
