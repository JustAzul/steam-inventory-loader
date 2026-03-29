import { SteamErrorType, Fields } from '../types.js';
import type {
  IHttpClient, ICacheStore, LoaderResponse, LoaderConfig,
  OptionalConfig, IInventoryProvider, SteamErrorInfo,
  IWorkerPool, IStrategy, ItemDetails, ParseConfig,
  InferItem,
} from '../types.js';
import { AxiosHttpClient } from '../http/http-client.js';
import { LruCacheStore } from '../cache/lru-cache.js';
import { StrategyRegistry } from '../strategies/registry.js';
import { resolveProviderChain, isCursorCompatible, registerProvider as chainRegisterProvider } from '../providers/provider-chain.js';
import { buildLoaderConfig, buildCacheKey } from './config.js';
import { PiscinaWorkerPool } from '../worker/piscina-worker-pool.js';
import { PaginationOrchestrator } from './pagination.js';
import { SteamError } from '../errors/errors.js';
import { resetRateLimiters } from '../http/rate-limiter.js';

const strategyRegistry = new StrategyRegistry();

/**
 * Shared cache singleton — all Loader instances share the same cache by default.
 * This means multiple bots loading inventories concurrently benefit from each other's
 * cache entries. The cache is size-aware (maxSize=512MB) to prevent heap blowup.
 *
 * **Multi-instance warning:** All Loader instances using the default cache share state.
 * Use `Loader.createIsolated()` or pass a custom cache to the constructor for isolation.
 */
let sharedCache: ICacheStore<string, LoaderResponse> = new LruCacheStore();

/**
 * Main Loader class — orchestrates provider chain, cache, and pagination (FR01-FR06, FR65-FR66).
 * Constructor injection with production defaults (no DI container).
 *
 * **Shared state:** Cache and strategy registry are shared by default across all Loader instances.
 * Use `Loader.createIsolated()` for a fully independent instance, or override via constructor.
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
   * Create a Loader with isolated cache and strategy registry.
   * No shared state with other Loader instances — safe for multi-bot deployments.
   */
  static createIsolated(http?: IHttpClient): Loader {
    return new Loader(
      http ?? new AxiosHttpClient(),
      new LruCacheStore(),
      undefined,
      new StrategyRegistry(),
    );
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
   * **Shared state warning:** Mutates the shared strategy registry — affects all Loader
   * instances using the default. Use `Loader.createIsolated()` for independent registries.
   */
  static registerStrategy(appId: number, contextId: number, strategy: IStrategy): void {
    strategyRegistry.register(appId, contextId, strategy);
  }

  /** Register a custom provider (FR67). */
  static registerProvider(name: string, provider: IInventoryProvider): void {
    chainRegisterProvider(name, provider);
  }

  /**
   * Replace the shared cache instance.
   * **Shared state warning:** Mutates module state — affects all Loader instances
   * using the default cache. Use `Loader.createIsolated()` for independent caches.
   */
  static setSharedCache(cache: ICacheStore<string, LoaderResponse>): void {
    sharedCache = cache;
  }

  /** Reset all per-provider rate limiters. For test isolation. */
  static resetRateLimiters(): void {
    resetRateLimiters();
  }

  private resolvePool(config: LoaderConfig): { pool: IWorkerPool | null; autoPool: PiscinaWorkerPool | null } {
    const autoPool = !this.workerPool && config.maxWorkers
      ? new PiscinaWorkerPool({ maxWorkers: config.maxWorkers })
      : null;
    return { pool: this.workerPool ?? autoPool, autoPool };
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
    const config = buildLoaderConfig(steamId, appId, contextId, userConfig);

    const { pool, autoPool } = this.resolvePool(config);

    try {
      const cached = this.checkCache(config);
      if (cached) {
        yield cached.inventory;
        return;
      }

      const chain = resolveProviderChain(config);
      if (chain.length === 0) {
        throw new SteamError(SteamErrorType.BadStatus, 'No providers available');
      }

      const parseConfig = this.buildParseConfig(config);
      const customStrategy = this.registry.hasCustomStrategy(config.appId, config.contextId);

      for await (const { batch } of this.runProviderChain(chain, config, parseConfig, pool, customStrategy, {
        canFallback: (i, hasYielded) => !hasYielded && i < chain.length - 1,
        supportsCursorResume: false,
      })) {
        yield batch;
      }
    } finally {
      Loader.activeLoads--;
      if (autoPool) await autoPool.destroy();
    }
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  private async _load(
    steamId: unknown,
    appId: string | number,
    contextId: string | number,
    userConfig?: OptionalConfig,
  ): Promise<LoaderResponse> {
    const config = buildLoaderConfig(steamId, appId, contextId, userConfig);

    const { pool, autoPool } = this.resolvePool(config);

    try {
      return await this._loadInner(config, pool);
    } finally {
      if (autoPool) await autoPool.destroy();
    }
  }

  private async _loadInner(config: LoaderConfig, pool: IWorkerPool | null): Promise<LoaderResponse> {
    const cached = this.checkCache(config);
    if (cached) return cached;

    const chain = resolveProviderChain(config);
    if (chain.length === 0) {
      return errorResponse(new SteamError(SteamErrorType.BadStatus, 'No providers available'));
    }

    const parseConfig = this.buildParseConfig(config);
    const customStrategy = this.registry.hasCustomStrategy(config.appId, config.contextId);

    try {
      let inventory: ItemDetails[] = [];
      for await (const { batch, resetInventory } of this.runProviderChain(chain, config, parseConfig, pool, customStrategy, {
        canFallback: (i) => i < chain.length - 1,
        supportsCursorResume: true,
      })) {
        if (resetInventory) inventory = [];
        inventory.push(...batch);
      }
      return this.cacheAndReturn(inventory, config);
    } catch (err) {
      return errorResponse(toSteamError(err));
    }
  }

  private async *runProviderChain(
    chain: IInventoryProvider[],
    config: LoaderConfig,
    parseConfig: ParseConfig,
    pool: IWorkerPool | null,
    customStrategy: boolean,
    opts: {
      canFallback: (i: number, hasYielded: boolean) => boolean;
      supportsCursorResume: boolean;
    },
  ): AsyncGenerator<{ batch: ItemDetails[]; resetInventory: boolean }> {
    let hasYielded = false;
    let lastError: SteamError | null = null;
    let cursor: string | null = null;

    for (let i = 0; i < chain.length; i++) {
      const fallbackAllowed = opts.canFallback(i, hasYielded);
      const orchestrator = this.createOrchestrator(chain[i], config, parseConfig, fallbackAllowed, pool, customStrategy);
      try {
        for await (const batch of orchestrator.streamPages(cursor)) {
          yield { batch, resetInventory: false };
          hasYielded = true;
        }
        return; // Completed successfully
      } catch (err) {
        const steamErr = toSteamError(err);
        if (fallbackAllowed && chain[i].shouldFallback(steamErr)) {
          // Cursor-compatible fallback: resume from last cursor if next provider is compatible
          if (opts.supportsCursorResume && i + 1 < chain.length
            && isCursorCompatible(chain[i], chain[i + 1]) && orchestrator.lastCursor) {
            cursor = orchestrator.lastCursor;
          } else {
            cursor = null;
            if (hasYielded) {
              yield { batch: [], resetInventory: true };
              hasYielded = false;
            }
          }
          lastError = steamErr;
          continue;
        }
        throw steamErr;
      }
    }

    throw lastError ?? new SteamError(SteamErrorType.RateLimited, 'All providers rate limited');
  }

  private checkCache(config: LoaderConfig): LoaderResponse | undefined {
    if (!config.cache) return undefined;
    return this.cache.get(buildCacheKey(config));
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

  private buildParseConfig(config: LoaderConfig): ParseConfig {
    return {
      tradableOnly: config.tradableOnly,
      fields: config.fields,
      strategy: this.registry.get(config.appId, config.contextId),
      contextId: config.contextId,
    };
  }

  private createOrchestrator(
    provider: IInventoryProvider,
    config: LoaderConfig,
    parseConfig: ParseConfig,
    canFallback: boolean,
    pool: IWorkerPool | null,
    customStrategy: boolean,
  ): PaginationOrchestrator {
    return new PaginationOrchestrator({
      http: this.http,
      provider,
      config,
      parseConfig,
      canFallback,
      pool,
      activeLoadsGetter: () => Loader.activeLoads,
      customStrategy,
    });
  }
}

function errorResponse(error: SteamErrorInfo | SteamError): LoaderResponse {
  const info = error instanceof SteamError ? error.toErrorInfo() : error;
  return { success: false, count: 0, inventory: [], error: info };
}

function toSteamError(err: unknown): SteamError {
  return err instanceof SteamError ? err
    : new SteamError(SteamErrorType.NetworkError,
      err instanceof Error ? err.message : undefined);
}
