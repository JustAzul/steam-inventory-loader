import type {
  IHttpClient, ICacheStore, LoaderResponse, LoaderConfig,
  OptionalConfig, PageRequest, IInventoryProvider, SteamErrorInfo,
} from '../types.js';
import { AxiosHttpClient } from '../http/http-client.js';
import { LruCacheStore } from '../cache/lru-cache.js';
import { InMemoryInventoryRepository } from '../repository/inventory.js';
import { StrategyRegistry } from '../strategies/registry.js';
import { RetryPolicy } from '../http/retry.js';
import { resolveProviderChain, isCursorCompatible, registerProvider as chainRegisterProvider } from '../providers/provider-chain.js';
import { normalizeConfig, buildCacheKey } from './config.js';
import type { IStrategy } from '../types.js';

const strategyRegistry = new StrategyRegistry();

/**
 * Shared cache singleton — all Loader instances share the same cache by default.
 * This means multiple bots loading inventories concurrently benefit from each other's
 * cache entries. The cache is size-aware (maxSize=512MB) to prevent heap blowup.
 */
let sharedCache: ICacheStore<string, LoaderResponse> = new LruCacheStore();

/**
 * Main Loader class — orchestrates provider chain + repository (FR01-FR06, FR65-FR66).
 * Constructor injection with production defaults (no DI container).
 *
 * Cache is shared by default across all Loader instances. Override via constructor
 * for testing or custom cache backends.
 */
export class Loader {
  private http: IHttpClient;
  private cache: ICacheStore<string, LoaderResponse>;

  constructor(
    http?: IHttpClient,
    cache?: ICacheStore<string, LoaderResponse>,
  ) {
    this.http = http ?? new AxiosHttpClient();
    this.cache = cache ?? sharedCache;
  }

  /**
   * v3 compat static method: Loader.Loader(steamID64, appID, contextID, config)
   * Uses shared cache — multiple calls share the same cache.
   */
  static async Loader(
    steamId: unknown,
    appId: string | number,
    contextId: string | number,
    config?: OptionalConfig,
  ): Promise<LoaderResponse> {
    const loader = new Loader();
    return loader.load(steamId, appId, contextId, config);
  }

  /**
   * Register a custom strategy (FR68).
   */
  static registerStrategy(appId: number, contextId: number, strategy: IStrategy): void {
    strategyRegistry.register(appId, contextId, strategy);
  }

  /**
   * Register a custom provider (FR67).
   */
  static registerProvider(name: string, provider: IInventoryProvider): void {
    chainRegisterProvider(name, provider);
  }

  /**
   * Replace the shared cache instance.
   * Use for custom backends (Redis, SQLite) or to reconfigure limits.
   */
  static setSharedCache(cache: ICacheStore<string, LoaderResponse>): void {
    sharedCache = cache;
  }

  /**
   * Load a Steam inventory.
   */
  async load(
    steamId: unknown,
    appId: string | number,
    contextId: string | number,
    userConfig?: OptionalConfig,
  ): Promise<LoaderResponse> {
    const config = normalizeConfig(steamId, appId, contextId, userConfig);

    // Cache check (FR53)
    if (config.cache) {
      const cacheKey = buildCacheKey(config);
      const cached = this.cache.get(cacheKey);
      if (cached) return cached;
    }

    // Resolve provider chain
    const chain = resolveProviderChain(config);
    if (chain.length === 0) {
      return errorResponse({ type: 'bad_status', message: 'No providers available' });
    }

    // Strategy for this app/context
    const strategy = strategyRegistry.get(config.appId, config.contextId);
    const retryPolicy = new RetryPolicy({ maxRetries: config.maxRetries });

    // Try each provider in chain
    let lastError: SteamErrorInfo | null = null;

    for (let providerIdx = 0; providerIdx < chain.length; providerIdx++) {
      const provider = chain[providerIdx];
      const repo = new InMemoryInventoryRepository();
      let cursor: string | null = null;
      let retryCount = 0;

      // If switching from a different-method provider, start fresh
      if (providerIdx > 0 && !isCursorCompatible(chain[providerIdx - 1], provider)) {
        cursor = null;
      }

      // Pagination loop
      let pagesDone = false;
      while (!pagesDone) {
        const params: PageRequest = {
          steamId: config.steamId,
          appId: config.appId,
          contextId: config.contextId,
          language: config.language,
          count: config.itemsPerPage,
          cursor,
        };

        try {
          const request = provider.buildRequest(params, config);
          const response = await this.http.execute(request);

          // Non-2xx → classify error
          if (response.status < 200 || response.status >= 300) {
            const error = provider.classifyError(response.status, response.data);

            // Should we fallback to next provider?
            if (provider.shouldFallback(error) && providerIdx < chain.length - 1) {
              lastError = error;
              break; // move to next provider
            }

            // Retry logic
            retryCount++; // FR31: always increment before retry
            if (retryPolicy.shouldRetry(retryCount)) {
              const retryAfter = response.headers['retry-after'] as string | undefined;
              const delay = retryPolicy.getDelayFromRetryAfter(retryAfter)
                ?? retryPolicy.getDelay(retryCount - 1);
              await sleep(delay);
              continue;
            }

            return errorResponse(error);
          }

          // Parse response
          const page = provider.parseResponse(response.data);

          // Check for API-level errors
          if (!page.success) {
            const error: SteamErrorInfo = {
              type: page.eresult ? 'bad_status' : 'invalid_response',
              message: page.error ?? 'Unknown error',
              ...(page.eresult ? { eresult: page.eresult } : {}),
            };
            return errorResponse(error);
          }

          // fake_redirect → retry (FR30)
          if (page.fakeRedirect) {
            retryCount++;
            if (retryPolicy.shouldRetry(retryCount)) {
              await sleep(retryPolicy.getDelay(retryCount - 1));
              continue;
            }
            return errorResponse({ type: 'malformed_data', message: 'Persistent fake redirect' });
          }

          // Empty inventory early exit (FR06)
          if (page.totalInventoryCount === 0 && page.assets.length === 0) {
            const result: LoaderResponse = { success: true, count: 0, inventory: [] };
            if (config.cache) this.cache.set(buildCacheKey(config), result);
            return result;
          }

          // Anomalous empty: success but no assets (malformed)
          if (page.assets.length === 0 && page.totalInventoryCount > 0) {
            retryCount++;
            if (retryPolicy.shouldRetry(retryCount)) {
              await sleep(retryPolicy.getDelay(retryCount - 1));
              continue;
            }
            return errorResponse({ type: 'malformed_data', message: 'Success but no assets in response' });
          }

          // Process page through repository pipeline
          repo.addPage(page, {
            tradableOnly: config.tradableOnly,
            fields: config.fields,
            strategy,
            contextId: config.contextId,
          });

          // Pagination
          const nextCursor = provider.getNextCursor(page);
          if (nextCursor) {
            cursor = nextCursor;
            retryCount = 0; // Reset retries on successful page

            // Request delay between pages
            if (config.requestDelay > 0) {
              await sleep(config.requestDelay);
            }
          } else {
            pagesDone = true;
          }

        } catch (err) {
          // Network error
          retryCount++;
          if (retryPolicy.shouldRetry(retryCount)) {
            await sleep(retryPolicy.getDelay(retryCount - 1));
            continue;
          }
          return errorResponse({
            type: 'network_error',
            message: err instanceof Error ? err.message : 'Network error',
          });
        }
      }

      // If we completed pagination on this provider, return result
      if (pagesDone) {
        const result: LoaderResponse = {
          success: true,
          count: repo.getItemCount(),
          inventory: repo.getItems(),
        };
        if (config.cache) this.cache.set(buildCacheKey(config), result);
        return result;
      }
    }

    // All providers exhausted
    return errorResponse(lastError ?? { type: 'rate_limited', message: 'All providers rate limited' });
  }
}

function errorResponse(error: SteamErrorInfo): LoaderResponse {
  return { success: false, count: 0, inventory: [], error };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
