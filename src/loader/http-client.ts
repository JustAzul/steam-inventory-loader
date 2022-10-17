import { ProxyAgent, errors as UndiciErrors, request } from 'undici';

import { IncomingHttpHeaders } from 'http';
import { RequestOptions } from './types/request-options.type';
import { RequestParams } from './types/request-params.type';
import { SteamBodyResponse } from './types/steam-body-response.type';

export default class HttpClient {
  private static client = request;

  private cookies?: string;

  private defaultHeaders?: IncomingHttpHeaders;

  private proxyAgent?: ProxyAgent;

  constructor(proxyAddress?: string) {
    if (proxyAddress) {
      this.proxyAgent = new ProxyAgent(proxyAddress);
    }
  }

  private getDefaultHeaders(): IncomingHttpHeaders | undefined {
    if (this.cookies) {
      return {
        ...this.defaultHeaders,
        cookie: this.cookies,
      };
    }

    return this.defaultHeaders;
  }

  public async destroy(): Promise<void> {
    if (this.proxyAgent) {
      await this.proxyAgent.destroy();
    }
  }

  public setDefaultHeaders(headers: IncomingHttpHeaders): this {
    this.defaultHeaders = headers;
    return this;
  }

  public setDefaultCookies(cookies: string): this {
    this.cookies = cookies;
    return this;
  }

  public setProxy(proxyUrl: string): this {
    this.proxyAgent = new ProxyAgent(proxyUrl);
    return this;
  }

  public async get(
    url: string,
    params: RequestParams,
  ): Promise<SteamBodyResponse> {
    const options: RequestOptions = {
      method: 'GET',
      query: params,
      throwOnError: true,
    };

    const headers = this.getDefaultHeaders();

    if (headers) {
      options.headers = headers;
    }

    if (this.proxyAgent) {
      options.dispatcher = this.proxyAgent;
    }

    const { body } = await HttpClient.client(url, options);

    try {
      return JSON.parse(await body.text()) as SteamBodyResponse;
    } catch (e) {
      throw new UndiciErrors.UndiciError('Malformed response');
    }
  }

  public static IsErrorWithStatusCode(err: unknown): boolean {
    return err instanceof UndiciErrors.ResponseStatusCodeError;
  }

  public static IsSocketError(err: unknown): boolean {
    return err instanceof UndiciErrors.SocketError;
  }
}
