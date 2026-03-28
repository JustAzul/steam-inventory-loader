import { SteamErrorType, Fields } from '../types.js';
import type {
  IHttpClient, ICacheStore, LoaderResponse, LoaderConfig,
  OptionalConfig, PageRequest, IInventoryProvider, SteamErrorInfo,
  IWorkerPool, IStrategy, ItemDetails, ItemDescription, ParseConfig,
  InventoryPage, HttpResponse, InferItem, PartialItem,
} from '../types.js';
import { AxiosHttpClient } from '../http/http-client.js';
import { LruCacheStore } from '../cache/lru-cache.js';
import { DescriptionStore } from '../repository/description-store.js';
import { StrategyRegistry } from '../strategies/registry.js';
import { RetryPolicy } from '../http/retry.js';
import { getRateLimiter, resetRateLimiters, type ProviderRateLimiter } from '../http/rate-limiter.js';
import { resolveProviderChain, isCursorCompatible, registerProvider as chainRegisterProvider } from '../providers/provider-chain.js';
import { normalizeConfig, buildCacheKey } from './config.js';
import { shouldUseWorker } from '../worker/adaptive-decision.js';
import { PiscinaWorkerPool } from '../worker/piscina-worker-pool.js';
import type { ProcessPageData } from '../worker/process-page-task.js';
import { processAssets } from '../pipeline/process-assets.js';
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

// ─── Result type for _attemptFetch (avoids try/catch in _fetchPage) ──────

type FetchAttemptOk = { ok: true; page: InventoryPage };
type FetchAttemptFail = {
  ok: false;
  error: SteamError;
  shouldFallback: boolean;
  retryAfterDelay?: number;
};
type FetchAttemptResult = FetchAttemptOk | FetchAttemptFail;

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
    steamId: unknown, appId: string | number, contextId: string | number,
    config?: OptionalConfig & { fields?: undefined },
  ): Promise<LoaderResponse<ItemDetails>>;
  static async Loader<const F extends readonly Fields[]>(
    steamId: unknown, appId: string | number, contextId: string | number,
    config: OptionalConfig & { fields: F },
  ): Promise<LoaderResponse<InferItem<F>>>;
  static async Loader(
    steamId: unknown,
    appId: string | number,
    contextId: string | number,
    config?: OptionalConfig,
  ): Promise<LoaderResponse> {
    const loader = new Loader();
    return loader.load(steamId, appId, contextId, config as OptionalConfig & { fields?: undefined });
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

  /** Reset all per-provider rate limiters. For test isolation. */
  static resetRateLimiters(): void {
    resetRateLimiters();
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Load a Steam inventory.
   * When `fields` is specified, the returned items are narrowed to only those fields.
   */
  async load(
    steamId: unknown, appId: string | number, contextId: string | number,
    userConfig?: OptionalConfig & { fields?: undefined },
  ): Promise<LoaderResponse<ItemDetails>>;
  async load<const F extends readonly Fields[]>(
    steamId: unknown, appId: string | number, contextId: string | number,
    userConfig: OptionalConfig & { fields: F },
  ): Promise<LoaderResponse<InferItem<F>>>;
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

  /**
   * Stream a Steam inventory page-by-page as an async iterable.
   * Yields ItemDetails[] per page — consumers process incrementally.
   * Throws SteamError on failures (consumers see partial results via items already consumed).
   * Does not write to cache (streaming avoids holding all items in memory).
   * When `fields` is specified, yielded items are narrowed to only those fields.
   */
  loadStream(
    steamId: unknown, appId: string | number, contextId: string | number,
    userConfig?: OptionalConfig & { fields?: undefined },
  ): AsyncGenerator<ItemDetails[]>;
  loadStream<const F extends readonly Fields[]>(
    steamId: unknown, appId: string | number, contextId: string | number,
    userConfig: OptionalConfig & { fields: F },
  ): AsyncGenerator<InferItem<F>[]>;
  async *loadStream(
    steamId: unknown,
    appId: string | number,
    contextId: string | number,
    userConfig?: OptionalConfig,
  ): AsyncGenerator<ItemDetails[]> {
    Loader.activeLoads++;
    const config = normalizeConfig(steamId, appId, contextId, userConfig);

    // Local pool variable to avoid concurrent mutation of this.workerPool
    const autoPool = !this.workerPool && config.maxWorkers
      ? new PiscinaWorkerPool({ maxWorkers: config.maxWorkers })
      : null;
    const pool = this.workerPool ?? autoPool;

    try {
      // Cache hit → yield as single batch
      const cached = this.checkCache(config);
      if (cached) {
        yield cached.inventory;
        return;
      }

      const chain = resolveProviderChain(config);
      if (chain.length === 0) {
        throw new SteamError(SteamErrorType.BadStatus, 'No providers available');
      }

      const strategy = this.registry.get(config.appId, config.contextId);
      const parseConfig: ParseConfig = {
        tradableOnly: config.tradableOnly,
        fields: config.fields,
        strategy,
        contextId: config.contextId,
      };

      let hasYielded = false;
      let lastError: SteamError | null = null;

      for (let i = 0; i < chain.length; i++) {
        const canFallback = !hasYielded && i < chain.length - 1;
        try {
          for await (const batch of this._streamPages(config, chain[i], parseConfig, canFallback, pool)) {
            yield batch;
            hasYielded = true;
          }
          return;
        } catch (err) {
          const steamErr = err instanceof SteamError ? err
            : new SteamError(SteamErrorType.NetworkError,
              err instanceof Error ? err.message : undefined);
          if (canFallback && chain[i].shouldFallback(steamErr)) {
            lastError = steamErr;
            continue;
          }
          throw steamErr;
        }
      }

      throw lastError ?? new SteamError(SteamErrorType.RateLimited, 'All providers rate limited');
    } finally {
      Loader.activeLoads--;
      if (autoPool) await autoPool.destroy();
    }
  }

  // ─── Internal: setup ─────────────────────────────────────────────────────

  private async _load(
    steamId: unknown,
    appId: string | number,
    contextId: string | number,
    userConfig?: OptionalConfig,
  ): Promise<LoaderResponse> {
    const config = normalizeConfig(steamId, appId, contextId, userConfig);

    // Local pool variable to avoid concurrent mutation of this.workerPool
    const autoPool = !this.workerPool && config.maxWorkers
      ? new PiscinaWorkerPool({ maxWorkers: config.maxWorkers })
      : null;
    const pool = this.workerPool ?? autoPool;

    try {
      return await this._loadInner(config, pool);
    } finally {
      if (autoPool) await autoPool.destroy();
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

  // ─── Internal: orchestration ─────────────────────────────────────────────

  private async _loadInner(config: LoaderConfig, pool: IWorkerPool | null): Promise<LoaderResponse> {
    const cached = this.checkCache(config);
    if (cached) return cached;

    const chain = resolveProviderChain(config);
    if (chain.length === 0) {
      return errorResponse(new SteamError(SteamErrorType.BadStatus, 'No providers available'));
    }

    const strategy = this.registry.get(config.appId, config.contextId);
    const parseConfig: ParseConfig = {
      tradableOnly: config.tradableOnly,
      fields: config.fields,
      strategy,
      contextId: config.contextId,
    };

    let lastError: SteamError | null = null;

    for (let i = 0; i < chain.length; i++) {
      const canFallback = i < chain.length - 1;
      try {
        const inventory: ItemDetails[] = [];
        for await (const batch of this._streamPages(config, chain[i], parseConfig, canFallback, pool)) {
          inventory.push(...batch);
        }
        return this.cacheAndReturn(inventory, config);
      } catch (err) {
        const steamErr = err instanceof SteamError ? err
          : new SteamError(SteamErrorType.NetworkError,
            err instanceof Error ? err.message : undefined);
        if (canFallback && chain[i].shouldFallback(steamErr)) {
          lastError = steamErr;
          continue;
        }
        return errorResponse(steamErr);
      }
    }

    return errorResponse(
      lastError ?? new SteamError(SteamErrorType.RateLimited, 'All providers rate limited'),
    );
  }

  // ─── Internal: pagination generator ──────────────────────────────────────

  /**
   * Paginate a single provider's inventory, yielding ItemDetails[] per page.
   * Throws SteamError on terminal failure.
   */
  private async *_streamPages(
    config: LoaderConfig,
    provider: IInventoryProvider,
    parseConfig: ParseConfig,
    canFallback: boolean,
    pool: IWorkerPool | null,
  ): AsyncGenerator<ItemDetails[]> {
    const descStore = new DescriptionStore();
    const retryPolicy = new RetryPolicy({ maxRetries: config.maxRetries });
    const limiter = getRateLimiter(provider.name, config.requestDelay, config.rateLimitCooldown);
    let cursor: string | null = null;

    // Worker offloading state (FR58-FR61)
    let isFirstPage = true;
    let useWorker = false;
    let workerFailures = 0;
    let previousDescriptions: ItemDescription[] = [];

    while (true) {
      const params: PageRequest = {
        steamId: config.steamId,
        appId: config.appId,
        contextId: config.contextId,
        language: config.language,
        count: config.itemsPerPage,
        cursor,
      };

      // Rate limit: acquire slot before every page (instant when no contention)
      await limiter.acquire();

      const page = await this._fetchPage(provider, params, config, retryPolicy, canFallback, limiter);

      // Empty inventory early exit (FR06)
      if (page.totalInventoryCount === 0 && page.assets.length === 0) return;

      // Process page → items
      let items: ItemDetails[];

      if (!useWorker || isFirstPage) {
        items = this._processPageMainThread(page, parseConfig, descStore);

        if (isFirstPage) {
          if (pool && shouldUseWorker(page.totalInventoryCount, Loader.activeLoads)) {
            useWorker = true;
          }
          isFirstPage = false;
        }
      } else {
        const result = await this._processPageWithWorker(
          page, parseConfig, descStore, previousDescriptions, config, pool!,
        );
        items = result.items;
        if (result.failed) {
          workerFailures++;
          if (workerFailures >= WORKER_CONSECUTIVE_FAILURE_LIMIT) useWorker = false;
        } else {
          workerFailures = 0;
        }
      }

      previousDescriptions = page.descriptions;
      yield items;

      // Pagination cursor
      const nextCursor = provider.getNextCursor(page);
      if (!nextCursor) return;
      cursor = nextCursor;
    }
  }

  // ─── Internal: page fetch with retry ─────────────────────────────────────

  /**
   * Fetch and validate a single inventory page with retry.
   * Zero try/catch — delegates to _attemptFetch which returns a result type.
   */
  private async _fetchPage(
    provider: IInventoryProvider,
    params: PageRequest,
    config: LoaderConfig,
    retryPolicy: RetryPolicy,
    canFallback: boolean,
    limiter: ProviderRateLimiter,
  ): Promise<InventoryPage> {
    for (let attempt = 1; ; attempt++) {
      const result = await this._attemptFetch(provider, params, config, retryPolicy);

      if (result.ok) return result.page;

      // Report 429 to rate limiter → blocks other concurrent loads
      if (result.error.type === SteamErrorType.RateLimited) {
        limiter.reportRateLimit(result.retryAfterDelay);
      }

      // Fallback-worthy → throw immediately, let provider loop handle
      if (result.shouldFallback && canFallback) throw result.error;

      // Retries exhausted → throw
      if (!retryPolicy.shouldRetry(attempt)) throw result.error;

      // This load: exponential backoff
      const delay = result.retryAfterDelay ?? retryPolicy.getDelay(attempt - 1);
      await sleep(delay);

      // Acquire rate limiter slot before retrying
      await limiter.acquire();
    }
  }

  /**
   * Single HTTP attempt → result type (no exceptions for expected errors).
   * One try/catch for network I/O only.
   */
  private async _attemptFetch(
    provider: IInventoryProvider,
    params: PageRequest,
    config: LoaderConfig,
    retryPolicy: RetryPolicy,
  ): Promise<FetchAttemptResult> {
    let response: HttpResponse;
    try {
      const request = provider.buildRequest(params, config);
      response = await this.http.execute(request);
    } catch (err) {
      return {
        ok: false,
        error: new SteamError(SteamErrorType.NetworkError,
          err instanceof Error ? err.message : undefined),
        shouldFallback: false,
      };
    }

    // HTTP error
    if (response.status < 200 || response.status >= 300) {
      const errorInfo = provider.classifyError(response.status, response.data);
      const error = errorInfo instanceof SteamError
        ? errorInfo
        : new SteamError(errorInfo.type, errorInfo.message, errorInfo.eresult);
      return {
        ok: false,
        error,
        shouldFallback: provider.shouldFallback(errorInfo),
        retryAfterDelay: retryPolicy.getDelayFromRetryAfter(
          response.headers['retry-after'] as string | undefined,
        ) ?? undefined,
      };
    }

    // Parse response
    const page = provider.parseResponse(response.data);

    if (!page.success) {
      return {
        ok: false,
        error: page.eresult
          ? new SteamError(SteamErrorType.BadStatus, page.error ?? 'Unknown error', page.eresult)
          : new SteamError(SteamErrorType.InvalidResponse, page.error ?? 'Unknown error'),
        shouldFallback: false,
      };
    }

    // Fake redirect (FR30)
    if (page.fakeRedirect) {
      return {
        ok: false,
        error: new SteamError(SteamErrorType.MalformedData, 'Persistent fake redirect'),
        shouldFallback: false,
      };
    }

    // Anomalous empty: success but no assets (malformed)
    if (page.assets.length === 0 && page.totalInventoryCount > 0) {
      return {
        ok: false,
        error: new SteamError(SteamErrorType.MalformedData, 'Success but no assets in response'),
        shouldFallback: false,
      };
    }

    return { ok: true, page };
  }

  // ─── Internal: page processing ───────────────────────────────────────────

  /**
   * Process a page on the main thread via DescriptionStore + processAssets pipeline.
   */
  private _processPageMainThread(
    page: InventoryPage,
    parseConfig: ParseConfig,
    descStore: DescriptionStore,
  ): ItemDetails[] {
    descStore.addPage(page.descriptions);
    return processAssets(page.assets, descStore, parseConfig);
  }

  /**
   * Attempt to process a page via worker pool with graceful fallback to main thread.
   * One try/catch for worker failure only.
   */
  private async _processPageWithWorker(
    page: InventoryPage,
    parseConfig: ParseConfig,
    descStore: DescriptionStore,
    previousDescriptions: ItemDescription[],
    config: LoaderConfig,
    pool: IWorkerPool,
  ): Promise<{ items: ItemDetails[]; failed: boolean }> {
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
      const items = await pool.run<ItemDetails[]>('processPage', pageData);
      return { items, failed: false };
    } catch {
      return { items: this._processPageMainThread(page, parseConfig, descStore), failed: true };
    }
  }
}

function errorResponse(error: SteamErrorInfo | SteamError): LoaderResponse {
  const info = error instanceof SteamError ? error.toErrorInfo() : error;
  return { success: false, count: 0, inventory: [], error: info };
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
