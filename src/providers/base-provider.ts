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

  parseResponse(raw: unknown): InventoryPage {
    return parseInventoryPage(JSON.stringify(raw));
  }

  getNextCursor(page: InventoryPage): string | null {
    return page.moreItems ? page.lastAssetId : null;
  }

  classifyError(status: number, _body: unknown): SteamErrorInfo {
    if (status === 429) return new SteamError(SteamErrorType.RateLimited);
    return SteamError.badStatus(status);
  }

  shouldFallback(error: SteamErrorInfo): boolean {
    return error.type === SteamErrorType.RateLimited;
  }
}
