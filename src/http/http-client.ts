import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import type { IHttpClient, HttpRequest, HttpResponse } from '../types.js';

const DEFAULT_TIMEOUT = 40_000; // FR37: 40s

/**
 * Axios-based HTTP client implementation (FR33).
 * Supports keep-alive, proxy, cookies, custom headers.
 */
export class AxiosHttpClient implements IHttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: DEFAULT_TIMEOUT,
      maxRedirects: 0,
      validateStatus: () => true, // Don't throw on non-2xx
    });
  }

  async execute(request: HttpRequest): Promise<HttpResponse> {
    const config: AxiosRequestConfig = {
      method: request.method,
      url: request.url,
      headers: request.headers,
      params: request.params,
      timeout: request.timeout ?? DEFAULT_TIMEOUT,
    };

    // Add cookies as header
    if (request.cookies?.length) {
      config.headers = {
        ...config.headers,
        Cookie: request.cookies.join('; '),
      };
    }

    // Proxy support via hpagent (FR42)
    if (request.proxy) {
      config.httpAgent = new HttpProxyAgent({ proxy: request.proxy });
      config.httpsAgent = new HttpsProxyAgent({ proxy: request.proxy });
    }

    const response = await this.client.request(config);

    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string | string[] | undefined>,
    };
  }

  destroy(): void {
    // No persistent connections to clean up in default axios
  }
}
