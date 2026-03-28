import type { IInventoryProvider, HttpRequest, InventoryPage, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { parseInventoryPage } from '../pipeline/parser.js';

/**
 * Steam.Supply provider — paid, different URL format (FR04).
 * Always uses count=5000 (FR39). URL does NOT have /{steamID}/{appID}/{contextID} appended.
 */
export class SteamSupplyProvider implements IInventoryProvider {
  readonly name = 'steamSupply';
  readonly method = 'steam-supply'; // Different method — cursor not compatible with steam-api

  isAvailable(config: LoaderConfig): boolean {
    return !!config.steamSupplyKey;
  }

  buildRequest(params: PageRequest, config: LoaderConfig): HttpRequest {
    const queryParams: Record<string, string | number> = {
      steamid: params.steamId,
      appid: params.appId,
      contextid: params.contextId,
      count: 5000, // FR39: always 5000
      l: params.language,
    };
    if (params.cursor) {
      queryParams.start_assetid = params.cursor;
    }

    return {
      method: 'GET',
      url: `https://steam.supply/API/${config.steamSupplyKey}/loadinventory`,
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
    if (status === 429) return { type: 'rate_limited', message: 'Rate limited by Steam.Supply' };
    if (status === 403) return { type: 'private_profile', message: 'This profile is private or you have issues with your steam.supply api key' };
    // Steam.Supply 401 = "inventory hidden or invalid API key" — could be either
    if (status === 401) return { type: 'private_profile', message: 'Inventory hidden or invalid Steam.Supply API key' };
    return { type: 'bad_status', message: `HTTP ${status}` };
  }

  shouldFallback(error: SteamErrorInfo): boolean {
    return error.type === 'rate_limited';
  }
}
