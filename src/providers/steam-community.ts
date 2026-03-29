import { SteamErrorType } from '../types.js';
import type { HttpRequest, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { SteamError } from '../errors/errors.js';
import { BaseInventoryProvider } from './base-provider.js';

/**
 * Steam Community provider — default Steam API endpoint (FR01).
 */
export class SteamCommunityProvider extends BaseInventoryProvider {
  readonly name = 'community';
  readonly method = 'steam-api';

  isAvailable(_config: LoaderConfig): boolean {
    return true; // Always available — no key required
  }

  buildRequest(params: PageRequest, config: LoaderConfig): HttpRequest {
    const url = `https://steamcommunity.com/inventory/${params.steamId}/${params.appId}/${params.contextId}`;

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
      proxy: config.proxy,
    };
  }

  classifyError(status: number, _body: unknown): SteamErrorInfo {
    const common = this.classifyCommonErrors(status);
    if (common) return common;
    if (status === 403) return new SteamError(SteamErrorType.PrivateProfile);
    if (status === 401) return new SteamError(SteamErrorType.AuthFailed);
    return SteamError.badStatus(status);
  }
}
