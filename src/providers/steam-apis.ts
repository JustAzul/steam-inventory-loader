import type { IInventoryProvider, HttpRequest, InventoryPage, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { parseInventoryPage } from '../pipeline/parser.js';

/**
 * SteamApis.com provider — paid, credit-based (FR03).
 */
export class SteamApisProvider implements IInventoryProvider {
  readonly name = 'steamApis';
  readonly method = 'steam-api'; // Same cursor format as Steam Community

  isAvailable(config: LoaderConfig): boolean {
    return !!config.steamApisKey;
  }

  buildRequest(params: PageRequest, config: LoaderConfig): HttpRequest {
    const queryParams: Record<string, string | number> = {
      api_key: config.steamApisKey!,
      l: params.language,
      count: params.count,
    };
    if (params.cursor) {
      queryParams.start_assetid = params.cursor;
    }

    return {
      method: 'GET',
      url: `https://api.steamapis.com/steam/inventory/${params.steamId}/${params.appId}/${params.contextId}`,
      params: queryParams,
    };
  }

  parseResponse(raw: unknown): InventoryPage {
    return parseInventoryPage(JSON.stringify(raw));
  }

  getNextCursor(page: InventoryPage): string | null {
    return page.moreItems ? page.lastAssetId : null;
  }

  classifyError(status: number, _body: unknown): SteamErrorInfo {
    if (status === 429) return { type: 'rate_limited', message: 'Rate limited by SteamApis' };
    if (status === 402) return { type: 'insufficient_balance', message: 'Insufficient SteamApis balance' };
    if (status === 401) return { type: 'auth_failed', message: 'Invalid SteamApis API key' };
    return { type: 'bad_status', message: `HTTP ${status}` };
  }

  shouldFallback(error: SteamErrorInfo): boolean {
    return error.type === 'rate_limited';
  }
}
