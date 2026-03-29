import { SteamErrorType } from '../types.js';
import type { HttpRequest, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { SteamError } from '../errors/errors.js';
import { BaseInventoryProvider } from './base-provider.js';

/**
 * Steam.Supply provider — paid, different URL format (FR04).
 * Always uses count=5000 (FR39). URL does NOT have /{steamID}/{appID}/{contextID} appended.
 *
 * @warning Steam.Supply is a third-party service with no SLA guarantee.
 * The API key appears in the URL path (e.g., `/API/{key}/loadinventory`),
 * making it visible in server logs, network traces, and proxy logs.
 */
export class SteamSupplyProvider extends BaseInventoryProvider {
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
      proxy: config.proxy,
    };
  }

  classifyError(status: number, _body: unknown): SteamErrorInfo {
    const common = this.classifyCommonErrors(status);
    if (common) return common;
    if (status === 403) return new SteamError(SteamErrorType.PrivateProfile, 'This profile is private or you have issues with your steam.supply api key');
    // Steam.Supply 401 = "inventory hidden or invalid API key" — could be either
    if (status === 401) return new SteamError(SteamErrorType.PrivateProfile, 'Inventory hidden or invalid Steam.Supply API key');
    return SteamError.badStatus(status);
  }
}
