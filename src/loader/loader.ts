import { SteamErrorType } from '../types.js';
import type {
  IHttpClient, ICacheStore, LoaderResponse, LoaderConfig,
  OptionalConfig, PageRequest, IInventoryProvider, SteamErrorInfo,
  IWorkerPool, IStrategy, ItemDetails, ItemDescription, ParseConfig,
} from '../types.js';
import { AxiosHttpClient } from '../http/http-client.js';
import { LruCacheStore } from '../cache/lru-cache.js';
import { InMemoryInventoryRepository } from '../repository/inventory.js';
import { StrategyRegistry } from '../strategies/registry.js';
import { RetryPolicy } from '../http/retry.js';
import { resolveProviderChain, isCursorCompatible, registerProvider as chainRegisterProvider } from '../providers/provider-chain.js';
import { normalizeConfig, buildCacheKey } from './config.js';
import { shouldUseWorker } from '../worker/adaptive-decision.js';
import { PiscinaWorkerPool } from '../worker/piscina-worker-pool.js';
import type { ProcessPageData } from '../worker/process-page-task.js';
import { SteamError } from '../errors/errors.js';

/** Consecutive worker failures before disabling worker offloading for the current load. */
const WORKER_CONSECUTIVE_FAILURE_LIMIT = 2;

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
 * Cache and strategy registry are shared by default across all Loader instances.
 * Override via constructor for testing or custom backends.
 */
export class Loader {
  private http: IHttpClient;
  private cache: ICacheStore<string, LoaderResponse>;
  private workerPool: IWorkerPool | null;
  private registry: StrategyRegistry;

  /** Tracks concurrent active load() calls across all Loader instances (FR59). */
  static activeLoads = 0;

  constructor(
    http?: IHttpClient,
    cache?: ICacheStore<string, LoaderResponse>,
    workerPool?: IWorkerPool,
    registry?: StrategyRegistry,
  ) {
    this.http = http ?? new AxiosHttpClient();
    this.cache = cache ?? sharedCache;
    this.workerPool = workerPool ?? null;
    this.registry = registry ?? strategyRegistry;
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
   * Mutates the shared strategy registry — affects all Loader instances using the default.
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
   * Mutates module state — affects all Loader instances using the default cache.
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
    Loader.activeLoads++;

    try {
      return await this._load(steamId, appId, contextId, userConfig);
    } finally {
      Loader.activeLoads--;
    }
  }

  private async _load(
    steamId: unknown,
    appId: string | number,
    contextId: string | number,
    userConfig?: OptionalConfig,
  ): Promise<LoaderResponse> {
    const config = normalizeConfig(steamId, appId, contextId, userConfig);

    // Auto-create worker pool from config if no constructor pool (FR61)
    let autoPool: PiscinaWorkerPool | null = null;
    if (!this.workerPool && config.maxWorkers) {
      autoPool = new PiscinaWorkerPool({ maxWorkers: config.maxWorkers });
      this.workerPool = autoPool;
    }

    try {
      return await this._loadInner(config);
    } finally {
      if (autoPool) {
        this.workerPool = null;
        await autoPool.destroy();
      }
    }
  }

  private checkCache(config: LoaderConfig): LoaderResponse | undefined {
    if (!config.cache) return undefined;
    const cacheKey = buildCacheKey(config);
    return this.cache.get(cacheKey);
  }

  private cacheAndReturn(inventory: ItemDetails[], config: LoaderConfig): LoaderResponse {
    const result: LoaderResponse = {
      success: true,
      count: inventory.length,
      inventory,
    };
    if (config.cache) this.cache.set(buildCacheKey(config), result);
    return result;
  }

  private async _loadInner(config: LoaderConfig): Promise<LoaderResponse> {
    const cached = this.checkCache(config);
    if (cached) return cached;

    const chain = resolveProviderChain(config);
    if (chain.length === 0) {
      return errorResponse(new SteamError(SteamErrorType.BadStatus, 'No providers available'));
    }

    const strategy = this.registry.get(config.appId, config.contextId);
    const retryPolicy = new RetryPolicy({ maxRetries: config.maxRetries });
    const parseConfig: ParseConfig = {
      tradableOnly: config.tradableOnly,
      fields: config.fields,
      strategy,
      contextId: config.contextId,
    };

    let lastError: SteamErrorInfo | SteamError | null = null;

    for (let providerIdx = 0; providerIdx < chain.length; providerIdx++) {
      const provider = chain[providerIdx];
      const repo = new InMemoryInventoryRepository();
      let cursor: string | null = null;
      let retryCount = 0;

      // Worker offloading state (FR58-FR61)
      let isFirstPage = true;
      let useWorker = false;
      let workerFailures = 0;
      let previousDescriptions: ItemDescription[] = [];
      let workerResults: ItemDetails[] = [];

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
            return errorResponse(
              page.eresult
                ? new SteamError(SteamErrorType.BadStatus, page.error ?? 'Unknown error', page.eresult)
                : new SteamError(SteamErrorType.InvalidResponse, page.error ?? 'Unknown error'),
            );
          }

          // fake_redirect → retry (FR30)
          if (page.fakeRedirect) {
            retryCount++;
            if (retryPolicy.shouldRetry(retryCount)) {
              await sleep(retryPolicy.getDelay(retryCount - 1));
              continue;
            }
            return errorResponse(new SteamError(SteamErrorType.MalformedData, 'Persistent fake redirect'));
          }

          // Empty inventory early exit (FR06)
          if (page.totalInventoryCount === 0 && page.assets.length === 0) {
            return this.cacheAndReturn([], config);
          }

          // Anomalous empty: success but no assets (malformed)
          if (page.assets.length === 0 && page.totalInventoryCount > 0) {
            retryCount++;
            if (retryPolicy.shouldRetry(retryCount)) {
              await sleep(retryPolicy.getDelay(retryCount - 1));
              continue;
            }
            return errorResponse(new SteamError(SteamErrorType.MalformedData, 'Success but no assets in response'));
          }

          // After page 1: decide whether to use workers (FR58-FR61)
          if (isFirstPage) {
            // Page 1 always on main thread — reveals totalInventoryCount
            repo.addPage(page, parseConfig);

            if (this.workerPool && shouldUseWorker(page.totalInventoryCount, Loader.activeLoads)) {
              useWorker = true;
            }
            previousDescriptions = page.descriptions;
            isFirstPage = false;
          } else if (useWorker) {
            // Offload to worker thread (FR58)
            try {
              const pageData: ProcessPageData = {
                assets: page.assets,
                descriptions: page.descriptions,
                previousDescriptions,
                config: {
                  tradableOnly: config.tradableOnly,
                  fields: config.fields,
                  contextId: config.contextId,
                  appId: config.appId,
                },
              };
              const items = await this.workerPool!.run<ItemDetails[]>('processPage', pageData);
              workerResults.push(...items);
              workerFailures = 0; // Reset on success — only consecutive failures trigger fallback
              previousDescriptions = page.descriptions;
            } catch {
              // Graceful fallback: process this page on main thread.
              workerFailures++;
              if (workerFailures >= WORKER_CONSECUTIVE_FAILURE_LIMIT) {
                useWorker = false;
              }
              repo.addPage(page, parseConfig);
            }
          } else {
            // Main thread processing (default path)
            repo.addPage(page, parseConfig);
          }

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
          return errorResponse(
            new SteamError(SteamErrorType.NetworkError, err instanceof Error ? err.message : undefined),
          );
        }
      }

      // If we completed pagination on this provider, return result
      if (pagesDone) {
        const repoItems = repo.getItems();
        const inventory = workerResults.length > 0
          ? [...repoItems, ...workerResults]
          : repoItems;
        return this.cacheAndReturn(inventory, config);
      }
    }

    // All providers exhausted
    return errorResponse(lastError ?? new SteamError(SteamErrorType.RateLimited, 'All providers rate limited'));
  }
}

function errorResponse(error: SteamErrorInfo | SteamError): LoaderResponse {
  const info = error instanceof SteamError ? error.toErrorInfo() : error;
  return { success: false, count: 0, inventory: [], error: info };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
