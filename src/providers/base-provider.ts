import { SteamErrorType } from '../types.js';
import type { IInventoryProvider, HttpRequest, InventoryPage, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { parseInventoryPage } from '../pipeline/parser.js';
import { SteamError } from '../errors/errors.js';

/**
 * Abstract base provider with shared defaults (DRY).
 * Subclasses must implement: name, method, isAvailable(), buildRequest().
 * Override classifyError() when provider has specific status→error mappings.
 */
export abstract class BaseInventoryProvider implements IInventoryProvider {
  abstract readonly name: string;
  abstract readonly method: string;
  abstract isAvailable(config: LoaderConfig): boolean;
  abstract buildRequest(params: PageRequest, config: LoaderConfig): HttpRequest;

  parseResponse(raw: unknown, onWarn?: (message: string) => void): InventoryPage {
    return parseInventoryPage(JSON.stringify(raw), onWarn);
  }

  getNextCursor(page: InventoryPage): string | null {
    return page.moreItems ? page.lastAssetId : null;
  }

  /**
   * Classify common HTTP status codes shared across all providers.
   * Returns a SteamErrorInfo for known common statuses, or null to let subclasses handle it.
   */
  protected classifyCommonErrors(status: number): SteamErrorInfo | null {
    if (status === 429) return new SteamError(SteamErrorType.RateLimited);
    return null;
  }

  classifyError(status: number, _body: unknown): SteamErrorInfo {
    return this.classifyCommonErrors(status) ?? SteamError.badStatus(status);
  }

  shouldFallback(error: SteamErrorInfo): boolean {
    return error.type === SteamErrorType.RateLimited;
  }
}
