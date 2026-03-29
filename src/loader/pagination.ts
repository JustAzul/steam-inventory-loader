import { SteamErrorType } from '../types.js';
import type {
  IHttpClient, IInventoryProvider, IWorkerPool,
  LoaderConfig, PageRequest, ParseConfig,
  InventoryPage, HttpResponse, ItemDetails,
} from '../types.js';
import { RetryPolicy } from '../http/retry.js';
import { getRateLimiter, type ProviderRateLimiter } from '../http/rate-limiter.js';
import { SteamError } from '../errors/errors.js';
import { PageProcessor } from './page-processor.js';

type FetchAttemptOk = { ok: true; page: InventoryPage };
type FetchAttemptFail = {
  ok: false;
  error: SteamError;
  shouldFallback: boolean;
  retryAfterDelay?: number;
};
type FetchAttemptResult = FetchAttemptOk | FetchAttemptFail;

export interface PaginationDeps {
  http: IHttpClient;
  provider: IInventoryProvider;
  config: LoaderConfig;
  parseConfig: ParseConfig;
  canFallback: boolean;
  pool: IWorkerPool | null;
  activeLoadsGetter: () => number;
  customStrategy: boolean;
}

export class PaginationOrchestrator {
  private readonly http: IHttpClient;
  private readonly provider: IInventoryProvider;
  private readonly config: LoaderConfig;
  private readonly canFallback: boolean;
  private readonly retryPolicy: RetryPolicy;
  private readonly limiter: ProviderRateLimiter;
  private readonly processor: PageProcessor;

  private _lastCursor: string | null = null;

  constructor(deps: PaginationDeps) {
    this.http = deps.http;
    this.provider = deps.provider;
    this.config = deps.config;
    this.canFallback = deps.canFallback;
    this.retryPolicy = new RetryPolicy({ maxRetries: deps.config.maxRetries });
    this.limiter = getRateLimiter(
      deps.provider.name, deps.config.requestDelay, deps.config.rateLimitCooldown,
    );
    this.processor = new PageProcessor({
      pool: deps.pool,
      parseConfig: deps.parseConfig,
      config: deps.config,
      activeLoadsGetter: deps.activeLoadsGetter,
      customStrategy: deps.customStrategy,
    });
  }

  get lastCursor(): string | null {
    return this._lastCursor;
  }

  async *streamPages(initialCursor: string | null = null): AsyncGenerator<ItemDetails[]> {
    let cursor = initialCursor;

    while (true) {
      const params: PageRequest = {
        steamId: this.config.steamId,
        appId: this.config.appId,
        contextId: this.config.contextId,
        language: this.config.language,
        count: this.config.itemsPerPage,
        cursor,
      };

      await this.limiter.acquire();
      const page = await this.fetchPage(params);

      if (page.totalInventoryCount === 0 && page.assets.length === 0) return;

      const items = await this.processor.processPage(page);
      yield items;

      const nextCursor = this.provider.getNextCursor(page);
      if (!nextCursor) return;
      cursor = nextCursor;
      this._lastCursor = cursor;
    }
  }

  private async fetchPage(params: PageRequest): Promise<InventoryPage> {
    for (let attempt = 1; ; attempt++) {
      const result = await this.attemptFetch(params);

      if (result.ok) return result.page;

      if (result.error.type === SteamErrorType.RateLimited) {
        this.limiter.reportRateLimit(result.retryAfterDelay);
      }

      if (result.shouldFallback && this.canFallback) throw result.error;
      if (!this.retryPolicy.shouldRetry(attempt)) throw result.error;

      const delay = result.retryAfterDelay ?? this.retryPolicy.getDelay(attempt - 1);
      await sleep(delay);
      await this.limiter.acquire();
    }
  }

  private async attemptFetch(params: PageRequest): Promise<FetchAttemptResult> {
    let response: HttpResponse;
    try {
      response = await this.executeRequest(params);
    } catch (err) {
      return {
        ok: false,
        error: new SteamError(SteamErrorType.NetworkError,
          err instanceof Error ? err.message : undefined),
        shouldFallback: false,
      };
    }
    return this.validateResponse(response);
  }

  private async executeRequest(params: PageRequest): Promise<HttpResponse> {
    const request = this.provider.buildRequest(params, this.config);
    return this.http.execute(request);
  }

  private validateResponse(response: HttpResponse): FetchAttemptResult {
    if (response.status < 200 || response.status >= 300) {
      const errorInfo = this.provider.classifyError(response.status, response.data);
      const error = errorInfo instanceof SteamError
        ? errorInfo
        : new SteamError(errorInfo.type, errorInfo.message, errorInfo.eresult);
      return {
        ok: false,
        error,
        shouldFallback: this.provider.shouldFallback(errorInfo),
        retryAfterDelay: this.retryPolicy.getDelayFromRetryAfter(
          response.headers['retry-after'] as string | undefined,
        ) ?? undefined,
      };
    }

    const page = this.provider.parseResponse(response.data, this.config.onWarn);

    if (!page.success) {
      return {
        ok: false,
        error: page.eresult
          ? new SteamError(SteamErrorType.BadStatus, page.error ?? 'Unknown error', page.eresult)
          : new SteamError(SteamErrorType.InvalidResponse, page.error ?? 'Unknown error'),
        shouldFallback: false,
      };
    }

    if (page.fakeRedirect) {
      return {
        ok: false,
        error: new SteamError(SteamErrorType.MalformedData, 'Persistent fake redirect'),
        shouldFallback: false,
      };
    }

    if (page.assets.length === 0 && page.totalInventoryCount > 0) {
      return {
        ok: false,
        error: new SteamError(SteamErrorType.MalformedData, 'Success but no assets in response'),
        shouldFallback: false,
      };
    }

    return { ok: true, page };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
