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
import HttpException from '@application/exceptions/http.exception';
import { IFetcher } from '@application/ports/fetcher.port';
import { IHttpClient } from '@application/ports/http-client.port';
import {
  HttpClientErrorCodes,
  HttpClientGetProps,
  HttpClientResponse,
  HttpErrorPayload,
} from '@application/types/http-response.type';
import { PROXY_ADDRESS } from '@infra/constants';
import { ErrorPayload } from '@shared/errors';
import { DataOrError, error, result } from '@shared/utils';

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

  public async execute<T>(
    props: HttpClientGetProps,
  ): Promise<HttpClientResponse<T>> {
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
      } = await this.client.get<T, AxiosResponse<T, never>, never>(url, options);

      return {
        data,
        headers: incomingHeaders as IncomingHttpHeaders,
        statusCode: status,
      };
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

      throw new HttpException({
        message,
        request: { url, headers: requestHeaders, params },
        response,
      });
    }
  }
}
