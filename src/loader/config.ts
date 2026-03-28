import type { LoaderConfig, OptionalConfig } from '../types.js';
import { mapV3Config, coerceSteamId, coerceNumber } from '../compat/v3-compat.js';

const DEFAULTS: Omit<LoaderConfig, 'steamId' | 'appId' | 'contextId'> = {
  language: 'english',
  tradableOnly: true,
  itemsPerPage: 2000,
  maxRetries: 3,
  requestDelay: 4000,
  cache: true,
  cacheTTL: 30_000,
  cacheMaxEntries: 20,
  cacheMaxSize: 512 * 1024 * 1024,
  endpointPriority: ['community'],
};

/**
 * Normalize user config into internal LoaderConfig.
 * Handles v3 key mapping, type coercion, and defaults.
 */
export function normalizeConfig(
  steamId: unknown,
  appId: string | number,
  contextId: string | number,
  userConfig: OptionalConfig = {},
): LoaderConfig {
  // Map v3 keys first
  const mapped = mapV3Config(userConfig);

  const config: LoaderConfig = {
    steamId: coerceSteamId(steamId),
    appId: coerceNumber(appId),
    contextId: coerceNumber(contextId),
    language: mapped.language ?? DEFAULTS.language,
    tradableOnly: mapped.tradableOnly ?? DEFAULTS.tradableOnly,
    itemsPerPage: mapped.itemsPerPage ?? DEFAULTS.itemsPerPage,
    maxRetries: mapped.maxRetries ?? DEFAULTS.maxRetries,
    requestDelay: mapped.requestDelay ?? DEFAULTS.requestDelay,
    cache: mapped.cache ?? DEFAULTS.cache,
    cacheTTL: mapped.cacheTTL ?? DEFAULTS.cacheTTL,
    cacheMaxEntries: mapped.cacheMaxEntries ?? DEFAULTS.cacheMaxEntries,
    cacheMaxSize: mapped.cacheMaxSize ?? DEFAULTS.cacheMaxSize,
    endpointPriority: mapped.endpointPriority ?? DEFAULTS.endpointPriority,
    steamApisKey: mapped.steamApisKey,
    steamSupplyKey: mapped.steamSupplyKey,
    customEndpoint: mapped.customEndpoint,
    proxy: mapped.proxy,
    cookies: (mapped as { cookies?: string[] }).cookies,
    fields: mapped.fields,
    maxWorkers: mapped.maxWorkers,
  };

  // FR38: Paid API forces delay=0 when not explicit
  if ((config.steamApisKey || config.steamSupplyKey) && mapped.requestDelay === undefined) {
    config.requestDelay = 0;
  }

  // FR05: Custom endpoint clears API keys
  if (config.customEndpoint) {
    config.steamApisKey = undefined;
    config.steamSupplyKey = undefined;
  }

  return config;
}

/**
 * Build cache key from config (FR55).
 */
export function buildCacheKey(config: LoaderConfig): string {
  const fieldsHash = config.fields ? config.fields.sort().join(',') : 'all';
  return `${config.steamId}_${config.appId}_${config.contextId}_${config.tradableOnly}_${fieldsHash}`;
}
