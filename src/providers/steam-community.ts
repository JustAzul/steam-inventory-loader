import type { IInventoryProvider, HttpRequest, InventoryPage, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { parseInventoryPage } from '../pipeline/parser.js';

/**
 * Steam Community provider — default Steam API endpoint (FR01).
 */
export class SteamCommunityProvider implements IInventoryProvider {
  readonly name = 'community';
  readonly method = 'steam-api';

  isAvailable(_config: LoaderConfig): boolean {
    return true; // Always available — no key required
  }

  buildRequest(params: PageRequest, config: LoaderConfig): HttpRequest {
    const url = config.customEndpoint
      ? `${config.customEndpoint}/${params.steamId}/${params.appId}/${params.contextId}`
      : `https://steamcommunity.com/inventory/${params.steamId}/${params.appId}/${params.contextId}`;

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
      headers: {
        Host: 'steamcommunity.com',
        Referer: `https://steamcommunity.com/profiles/${params.steamId}/inventory`,
      },
      params: queryParams,
      cookies: config.cookies,
    };
  }

  parseResponse(raw: unknown): InventoryPage {
    return parseInventoryPage(JSON.stringify(raw));
  }

  getNextCursor(page: InventoryPage): string | null {
    return page.moreItems ? page.lastAssetId : null;
  }

  classifyError(status: number, body: unknown): SteamErrorInfo {
    if (status === 429) return { type: 'rate_limited', message: 'Rate limited by Steam' };
    if (status === 403) return { type: 'private_profile', message: 'This profile is private.' };
    if (status === 401) return { type: 'auth_failed', message: 'Authentication failed' };
    return { type: 'bad_status', message: `HTTP ${status}` };
  }

  shouldFallback(error: SteamErrorInfo): boolean {
    return error.type === 'rate_limited';
  }
}
