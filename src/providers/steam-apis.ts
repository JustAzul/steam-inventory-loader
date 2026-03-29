import { SteamErrorType } from '../types.js';
import type { HttpRequest, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { SteamError } from '../errors/errors.js';
import { BaseInventoryProvider } from './base-provider.js';

/**
 * SteamApis.com provider — paid, credit-based (FR03).
 */
export class SteamApisProvider extends BaseInventoryProvider {
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
      proxy: config.proxy,
    };
  }

  classifyError(status: number, _body: unknown): SteamErrorInfo {
    const common = this.classifyCommonErrors(status);
    if (common) return common;
    if (status === 402) return new SteamError(SteamErrorType.InsufficientBalance);
    if (status === 401) return new SteamError(SteamErrorType.AuthFailed, 'Invalid SteamApis API key');
    return SteamError.badStatus(status);
  }
}
