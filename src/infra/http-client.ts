import 'reflect-metadata';
import axios, { AxiosInstance, AxiosRequestConfig, isAxiosError } from 'axios';
import { injectable, inject } from 'inversify';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { CookieJar } from 'tough-cookie';

import { IHttpClient } from '@application/ports/http-client.port';
import { HttpRequest } from '@domain/types/http-request.type';
import {
  HttpClientGetProps,
  HttpResponse,
} from '@domain/types/http-response.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import { PROXY_ADDRESS } from '@infra/constants';
import { HttpException } from '@infra/exceptions';
import { HttpResponseProcessor } from '@infra/http-processing/http-response-processor';

import { toIncomingHttpHeaders } from './helpers/axios-headers-to-incoming-http-headers.helper';
import { CookieParserService } from './services/cookie-parser.service';

@injectable()
export class HttpClient implements IHttpClient {
  private readonly axios: AxiosInstance;

  constructor(
    @inject(HttpResponseProcessor)
    private readonly responseProcessor: HttpResponseProcessor,
    @inject(CookieParserService)
    private readonly cookieParser: CookieParserService,
    @inject(PROXY_ADDRESS) private readonly proxyAddress?: string,
  ) {
    this.axios = axios.create({
      jar: new CookieJar(),
      withCredentials: true,
    });
    if (this.proxyAddress && this.proxyAddress.length > 0) {
      this.axios.defaults.httpsAgent = new SocksProxyAgent(this.proxyAddress);
    }
  }

  public setDefaultHeaders(headers: Record<string, string>): void {
    this.axios.defaults.headers.common = {
      ...this.axios.defaults.headers.common,
      ...headers,
    };
  }

  public setDefaultCookies(cookies: string): void {
    const parsedCookies = this.cookieParser.parse(cookies);
    for (const key in parsedCookies) {
      (this.axios.defaults.jar as CookieJar).setCookieSync(
        `${key}=${parsedCookies[key]}`,
        'https://steamcommunity.com',
      );
    }
  }

  async execute(
    props: HttpClientGetProps,
  ): Promise<InventoryPageResult | undefined> {
    const { url, params, headers } = props;
    const config: AxiosRequestConfig = {
      headers: { ...this.axios.defaults.headers.common, ...headers },
      params,
    };

    const request: HttpRequest = {
      headers: config.headers ? toIncomingHttpHeaders(config.headers) : {},
      params,
      url,
    };
    try {
      const {
        data,
        status,
        headers: responseHeaders,
      } = await this.axios.get(url, config);
      const response: HttpResponse<InventoryPageResult> = {
        data,
        headers: toIncomingHttpHeaders(responseHeaders),
        statusCode: status,
      };
      return this.responseProcessor.execute({ request, response });
    } catch (error) {
      if (isAxiosError(error)) {
        const httpException = new HttpException({
          message: error.message,
          request,
          response: error.response
            ? {
                data: error.response.data,
                headers: toIncomingHttpHeaders(error.response.headers),
                statusCode: error.response.status,
              }
            : {},
        });
        return this.responseProcessor.execute({
          error: httpException,
          request,
        });
      }
      throw error;
    }
  }

  public destroy(): void {
    // The factory should handle agent destruction if needed.
  }
}
