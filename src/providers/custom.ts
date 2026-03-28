import { SteamErrorType } from '../types.js';
import type { IInventoryProvider, HttpRequest, InventoryPage, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { parseInventoryPage } from '../pipeline/parser.js';
import { SteamError } from '../errors/errors.js';

/**
 * Custom provider — user-provided endpoint (FR05).
 * Clears API keys when custom endpoint is configured.
 */
export class CustomProvider implements IInventoryProvider {
  readonly name = 'custom';
  readonly method = 'steam-api'; // Assumes Steam-compatible response format

  isAvailable(config: LoaderConfig): boolean {
    return !!config.customEndpoint;
  }

  buildRequest(params: PageRequest, config: LoaderConfig): HttpRequest {
    const url = `${config.customEndpoint}/${params.steamId}/${params.appId}/${params.contextId}`;

    const queryParams: Record<string, string | number> = {
      l: params.language,
      count: params.count,
    };
    if (params.cursor) {
      queryParams.start_assetid = params.cursor;
    }

    return {
      method: 'GET',
      url,
      params: queryParams,
      proxy: config.proxy,
      // No API keys — custom endpoint clears them (FR05)
    };
  }

  parseResponse(raw: unknown): InventoryPage {
    return parseInventoryPage(JSON.stringify(raw));
  }

  getNextCursor(page: InventoryPage): string | null {
    return page.moreItems ? page.lastAssetId : null;
  }

  classifyError(status: number, _body: unknown): SteamErrorInfo {
    if (status === 429) return new SteamError(SteamErrorType.RateLimited);
    if (status === 403) return new SteamError(SteamErrorType.PrivateProfile);
    return SteamError.badStatus(status);
  }

  shouldFallback(error: SteamErrorInfo): boolean {
    return error.type === SteamErrorType.RateLimited;
  }
}
