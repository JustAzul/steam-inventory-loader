import type { LoaderConfig, OptionalConfig, LoadConfig, FlatConfig, CacheConfig } from '../types.js';
import { mapV3Config, coerceSteamId, coerceNumber } from '../compat/v3-compat.js';

const DEFAULTS: Omit<LoaderConfig, 'steamId' | 'appId' | 'contextId'> = {
  language: 'english',
  tradableOnly: true,
  itemsPerPage: 2500,
  maxRetries: 3,
  requestDelay: 4000,
  cache: true,
  cacheTTL: 30_000,
  cacheMaxEntries: 20,
  cacheMaxSize: 512 * 1024 * 1024,
  endpointPriority: ['community'],
  rateLimitCooldown: 30_000,
  onWarn: (msg: string) => { console.warn(msg); },
};

/**
 * Detect grouped (LoadConfig) vs flat (FlatConfig) config.
 * Grouped configs use `providers` or `cache` as an object.
 */
function isGroupedConfig(config: OptionalConfig): config is LoadConfig {
  return 'providers' in config
    || 'rateLimit' in config
    || (typeof (config as LoadConfig).cache === 'object' && (config as LoadConfig).cache !== null);
}

/**
 * Flatten a LoadConfig into the internal flat form for normalization.
 */
function flattenGroupedConfig(config: LoadConfig): FlatConfig & { cookies?: string[]; rateLimitCooldown?: number } {
  const flat: FlatConfig & { cookies?: string[]; rateLimitCooldown?: number } = {
    language: config.language,
    tradableOnly: config.tradableOnly,
    fields: config.fields,
    itemsPerPage: config.itemsPerPage,
    maxRetries: config.maxRetries,
    requestDelay: config.requestDelay,
    proxy: config.proxy,
    maxWorkers: config.maxWorkers,
    rateLimitCooldown: config.rateLimit?.defaultCooldown,
    onWarn: config.onWarn,
  };

  // Cache: boolean or object
  if (typeof config.cache === 'object' && config.cache !== null) {
    flat.cache = true;
    flat.cacheTTL = config.cache.ttl;
    flat.cacheMaxEntries = config.cache.maxEntries;
    flat.cacheMaxSize = config.cache.maxSize;
  } else {
    flat.cache = config.cache as boolean | undefined;
  }

  // Providers
  if (config.providers) {
    flat.endpointPriority = config.providers.priority;
    flat.steamApisKey = config.providers.steamApisKey;
    flat.steamSupplyKey = config.providers.steamSupplyKey;
    flat.customEndpoint = config.providers.customEndpoint;
    flat.customHeaders = config.providers.customHeaders;
  }

  return flat;
}

/**
 * Build internal LoaderConfig from user input.
 * Accepts both grouped (LoadConfig) and flat (FlatConfig) forms.
 * Phase 1: flatten, coerce types, apply defaults.
 * Phase 2: apply business rules (FR38 paid API delay, FR05 custom endpoint clears keys).
 */
export function buildLoaderConfig(
  steamId: unknown,
  appId: string | number,
  contextId: string | number,
  userConfig: OptionalConfig = {},
): LoaderConfig {
  // Convert grouped config to flat form, or map v3 keys
  const mapped: FlatConfig & { cookies?: string[]; rateLimitCooldown?: number } = isGroupedConfig(userConfig)
    ? flattenGroupedConfig(userConfig)
    : mapV3Config(userConfig as FlatConfig);

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
    customHeaders: mapped.customHeaders,
    proxy: mapped.proxy,
    cookies: (mapped as { cookies?: string[] }).cookies,
    fields: mapped.fields,
    maxWorkers: mapped.maxWorkers,
    rateLimitCooldown: mapped.rateLimitCooldown ?? DEFAULTS.rateLimitCooldown,
    onWarn: mapped.onWarn ?? DEFAULTS.onWarn,
  };

  applyBusinessRules(config, mapped);

  return config;
}

/**
 * Apply business rules on top of the normalized config:
 * - FR38: Paid API forces delay=0 when not explicitly set
 * - FR05: Custom endpoint validation + auto-routing + clears API keys
 */
function applyBusinessRules(
  config: LoaderConfig,
  mapped: FlatConfig & { cookies?: string[]; rateLimitCooldown?: number },
): void {
  // FR38: Paid API forces delay=0 when not explicit
  if ((config.steamApisKey || config.steamSupplyKey) && mapped.requestDelay === undefined) {
    config.requestDelay = 0;
  }

  // FR05: Custom endpoint clears API keys
  if (config.customEndpoint) {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(config.customEndpoint);
    } catch {
      throw new Error('Invalid customEndpoint URL');
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(`Unsupported protocol "${parsedUrl.protocol}" in customEndpoint — only http: and https: are allowed`);
    }

    // Auto-route: ensure 'custom' provider is in priority, remove 'community'
    if (!config.endpointPriority.includes('custom')) {
      config.endpointPriority = ['custom', ...config.endpointPriority.filter(p => p !== 'community')];
    }

    config.steamApisKey = undefined;
    config.steamSupplyKey = undefined;
  }
}

/** @deprecated Use buildLoaderConfig instead. */
export const normalizeConfig = buildLoaderConfig;

const CACHE_VERSION = 1;

/**
 * Build cache key from config (FR55).
 */
export function buildCacheKey(config: LoaderConfig): string {
  const fieldsHash = config.fields ? [...config.fields].sort().join(',') : 'all';
  return `v${CACHE_VERSION}|${config.steamId}|${config.appId}|${config.contextId}|${config.language}|${config.tradableOnly}|${fieldsHash}`;
}
