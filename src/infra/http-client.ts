import { IncomingHttpHeaders } from 'http';
import { Agent as HttpsAgent } from 'https';

import Axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';
import { HttpsProxyAgent } from 'hpagent';
import { injectable, inject } from 'tsyringe';

import { DEFAULT_REQUEST_TIMEOUT } from '@application/constants';
import { IFetcher } from '@application/ports/fetcher.port';
import { IHttpClient } from '@application/ports/http-client.port';
import { HttpException } from '@domain/exceptions/http.exception';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '@domain/types/http-response.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import { PROXY_ADDRESS } from '@infra/constants';

import { HttpResponseProcessor } from './http-processing/http-response-processor';

@injectable()
export class HttpClient implements IFetcher, IHttpClient {
  private cookies?: string;
  private defaultHeaders?: IncomingHttpHeaders;
  private readonly client: AxiosInstance;
  private readonly proxyAgent?: HttpsProxyAgent;
  private static readonly defaultHttpsAgent: HttpsAgent = new HttpsAgent();

  constructor(
    @inject(PROXY_ADDRESS)
    private readonly proxyAddress: string,
    @inject('AxiosInstance')
    client: AxiosInstance,
    private readonly httpResponseProcessor: HttpResponseProcessor,
  ) {
    if (this.proxyAddress) {
      this.proxyAgent = new HttpsProxyAgent({
        keepAlive: true,
        proxy: this.proxyAddress,
      });
    }

    this.client = client || Axios.create(this.getClientConstructor());
  }

  private getClientConstructor(): CreateAxiosDefaults {
    return {
      httpsAgent: this.getAgent(),
      responseType: 'json',
      timeout: DEFAULT_REQUEST_TIMEOUT,
      validateStatus: (statusCode) => statusCode >= 200 && statusCode < 300,
    };
  }

  private getAgent(): HttpsProxyAgent | HttpsAgent {
    return this?.proxyAgent || HttpClient.defaultHttpsAgent;
  }

  public destroy(): void {
    if (this.proxyAgent) {
      this.proxyAgent.destroy();
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

  public async execute(
    props: HttpClientGetProps,
  ): Promise<InventoryPageResult> {
    const { url, headers: propsHeaders, params } = props;

    const requestHeaders = { ...this.defaultHeaders, ...propsHeaders };
    const requestCookies = [this.cookies, propsHeaders?.cookie]
      .filter(Boolean)
      .join('; ');

    if (requestCookies) {
      requestHeaders.cookie = requestCookies;
    }

    const options: AxiosRequestConfig<never> = {
      headers: requestHeaders,
      params,
    };

    try {
      const {
        data,
        headers: incomingHeaders,
        status,
      } = await this.client.get<
        InventoryPageResult,
        AxiosResponse<InventoryPageResult, never>,
        never
      >(url, options);

      const response: HttpClientResponse<InventoryPageResult> = {
        data,
        headers: incomingHeaders as IncomingHttpHeaders,
        statusCode: status,
      };
      return this.httpResponseProcessor.execute({
        response,
        request: { url, headers: requestHeaders, params },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'An unknown error occurred';
      let response: Partial<HttpClientResponse<unknown>> = {};

      if (Axios.isAxiosError(e)) {
        response = {
          data: e.response?.data,
          headers: (e.response?.headers as IncomingHttpHeaders) || {},
          statusCode: e.response?.status,
        };
      }

      const error = new HttpException({
        message,
        request: { url, headers: requestHeaders, params },
        response,
      });

      return this.httpResponseProcessor.execute({
        error,
        request: { url, headers: requestHeaders, params },
        response: response as HttpClientResponse<InventoryPageResult>,
      });
    }
  }
}
