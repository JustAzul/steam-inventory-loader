import { IncomingHttpHeaders } from 'http';

import { IFetcher } from '@application/ports/fetcher.port';
import { HttpClientGetProps } from '@application/types/http-response.type';
import { DEFAULT_REQUEST_TIMEOUT } from '@shared/constants';
import { ErrorPayload } from '@shared/errors';
import { error, result } from '@shared/utils';
import { HttpsAgent } from 'agentkeepalive';
import Axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';
import { HttpsProxyAgent } from 'hpagent';

export class HttpClient implements IFetcher {
  private cookies?: string;
  private defaultHeaders?: IncomingHttpHeaders;
  private readonly client: AxiosInstance;
  private readonly proxyAgent?: HttpsProxyAgent;
  private static readonly defaultHttpsAgent: HttpsAgent = new HttpsAgent();

  constructor(proxyAddress?: string) {
    if (proxyAddress) {
      this.proxyAgent = new HttpsProxyAgent({
        keepAlive: true,
        proxy: proxyAddress,
      });
    }

    this.client = Axios.create(this.getClientConstructor());
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

  public async execute<T>(props: HttpClientGetProps) {
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
      } = await this.client.get<T, AxiosResponse<T, never>, never>(
        url,
        options,
      );

      return result({
        data,
        headers: incomingHeaders as IncomingHttpHeaders,
        statusCode: status,
      });
    } catch (e) {
      if (Axios.isAxiosError(e)) {
        return error(
          new ErrorPayload({
            code: 'HTTP_CLIENT_ERROR',
            payload: {
              message: e.message,
              request: props,
              response: {
                data: e.response?.data,
                headers: (e.response?.headers as IncomingHttpHeaders) || null,
                statusCode: e.response?.status,
              },
            },
          }),
        );
      }

      if (e instanceof Error) {
        return error(
          new ErrorPayload({
            code: 'INTERNAL_ERROR',
            payload: {
              message: e.message,
              request: props,
            },
          }),
        );
      }

      return error(
        new ErrorPayload({
          code: 'UNKNOWN_ERROR',
          payload: {
            error: e,
            request: props,
          },
        }),
      );
    }
  }
}
