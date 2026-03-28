import { describe, it, expect } from 'vitest';
import { normalizeConfig } from '../../src/loader/config.js';
import type { LoadConfig, FlatConfig } from '../../src/types.js';

const STEAM_ID = '76561198356905764';

describe('normalizeConfig — grouped (LoadConfig)', () => {
  it('cache object → extracts ttl, maxEntries, maxSize', () => {
    const config: LoadConfig = {
      cache: { ttl: 5000, maxEntries: 10, maxSize: 100_000_000 },
    };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.cache).toBe(true);
    expect(result.cacheTTL).toBe(5000);
    expect(result.cacheMaxEntries).toBe(10);
    expect(result.cacheMaxSize).toBe(100_000_000);
  });

  it('cache: true → uses defaults', () => {
    const config: LoadConfig = { cache: true };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.cache).toBe(true);
    expect(result.cacheTTL).toBe(30_000);
    expect(result.cacheMaxEntries).toBe(20);
    expect(result.cacheMaxSize).toBe(512 * 1024 * 1024);
  });

  it('cache: false → disables cache', () => {
    const config: LoadConfig = { cache: false };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.cache).toBe(false);
  });

  it('cache object with partial fields → fills defaults', () => {
    const config: LoadConfig = {
      cache: { ttl: 10_000 },
    };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.cache).toBe(true);
    expect(result.cacheTTL).toBe(10_000);
    expect(result.cacheMaxEntries).toBe(20); // default
    expect(result.cacheMaxSize).toBe(512 * 1024 * 1024); // default
  });

  it('providers → extracts priority, keys, endpoint', () => {
    const config: LoadConfig = {
      providers: {
        priority: ['steamApis', 'community'],
        steamApisKey: 'test-key',
      },
    };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.endpointPriority).toEqual(['steamApis', 'community']);
    expect(result.steamApisKey).toBe('test-key');
  });

  it('providers with paid API → auto delay=0', () => {
    const config: LoadConfig = {
      providers: { steamApisKey: 'key' },
    };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.requestDelay).toBe(0);
  });

  it('providers with customEndpoint → clears API keys (FR05)', () => {
    const config: LoadConfig = {
      providers: {
        customEndpoint: 'https://my.proxy.com',
        steamApisKey: 'should-be-cleared',
      },
    };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.customEndpoint).toBe('https://my.proxy.com');
    expect(result.steamApisKey).toBeUndefined();
  });

  it('no optional groups → all defaults', () => {
    const config: LoadConfig = {};

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.language).toBe('english');
    expect(result.tradableOnly).toBe(true);
    expect(result.itemsPerPage).toBe(2000);
    expect(result.maxRetries).toBe(3);
    expect(result.requestDelay).toBe(4000);
    expect(result.cache).toBe(true);
    expect(result.endpointPriority).toEqual(['community']);
  });

  it('core fields pass through', () => {
    const config: LoadConfig = {
      language: 'german',
      tradableOnly: false,
      maxRetries: 5,
      requestDelay: 2000,
      proxy: 'http://proxy:8080',
      maxWorkers: 4,
    };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.language).toBe('german');
    expect(result.tradableOnly).toBe(false);
    expect(result.maxRetries).toBe(5);
    expect(result.requestDelay).toBe(2000);
    expect(result.proxy).toBe('http://proxy:8080');
    expect(result.maxWorkers).toBe(4);
  });
});

describe('normalizeConfig — flat (FlatConfig, backwards compat)', () => {
  it('flat config unchanged', () => {
    const config: FlatConfig = {
      cache: true,
      cacheTTL: 5000,
      cacheMaxEntries: 10,
      steamApisKey: 'key',
      endpointPriority: ['steamApis'],
    };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.cache).toBe(true);
    expect(result.cacheTTL).toBe(5000);
    expect(result.cacheMaxEntries).toBe(10);
    expect(result.steamApisKey).toBe('key');
    expect(result.endpointPriority).toEqual(['steamApis']);
  });

  it('v3 Language key still works', () => {
    const config: FlatConfig = { Language: 'german' };

    const result = normalizeConfig(STEAM_ID, 753, 6, config);

    expect(result.language).toBe('german');
  });

  it('no config → all defaults', () => {
    const result = normalizeConfig(STEAM_ID, 753, 6);

    expect(result.language).toBe('english');
    expect(result.tradableOnly).toBe(true);
    expect(result.cache).toBe(true);
  });
});
