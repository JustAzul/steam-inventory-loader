import { SteamErrorType } from '../types.js';
import type { HttpRequest, PageRequest, LoaderConfig, SteamErrorInfo } from '../types.js';
import { SteamError } from '../errors/errors.js';
import { BaseInventoryProvider } from './base-provider.js';

/** Headers that should not be overridden by customHeaders — may break HTTP transport. */
const DANGEROUS_HEADERS = ['host', 'content-length', 'transfer-encoding', 'connection'];

/**
 * Custom provider — user-provided endpoint (FR05).
 * Clears API keys when custom endpoint is configured.
 */
export class CustomProvider extends BaseInventoryProvider {
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

    if (config.customHeaders) {
      const dangerous = Object.keys(config.customHeaders)
        .filter(h => DANGEROUS_HEADERS.includes(h.toLowerCase()));
      if (dangerous.length > 0) {
        config.onWarn(`[azul-steam-inventory-loader] customHeaders contains dangerous header(s): ${dangerous.join(', ')}. These may break HTTP transport.`);
      }
    }

    return {
      method: 'GET',
      url,
      params: queryParams,
      headers: config.customHeaders,
      proxy: config.proxy,
      // No API keys — custom endpoint clears them (FR05)
    };
  }

  classifyError(status: number, _body: unknown): SteamErrorInfo {
    const common = this.classifyCommonErrors(status);
    if (common) return common;
    if (status === 403) return new SteamError(SteamErrorType.PrivateProfile);
    return SteamError.badStatus(status);
  }
}
