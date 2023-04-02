import Axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';
import {
  HttpClientGetProps,
  HttpClientResponse,
  IHttpClient,
} from '../application/ports/http-client.interface';

import { DEFAULT_REQUEST_TIMEOUT } from '../shared/constants';
import { HttpsAgent } from 'agentkeepalive';
import { HttpsProxyAgent } from 'hpagent';
import { IncomingHttpHeaders } from 'http';

export default class HttpClient implements IHttpClient {
  private client: AxiosInstance;

  private cookies?: string;

  private defaultHeaders?: IncomingHttpHeaders;

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
      headers: this.getDefaultHeaders(),
      httpsAgent: this.getAgent(),
      responseType: 'json',
      timeout: DEFAULT_REQUEST_TIMEOUT,
    };
  }

  private getAgent(): HttpsProxyAgent | HttpsAgent {
    return this?.proxyAgent || HttpClient.defaultHttpsAgent;
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

  public async get<T>(
    props: HttpClientGetProps,
  ): Promise<HttpClientResponse<T>> {
    const { url, headers } = props;

    const options: AxiosRequestConfig<never> = {
      headers,
    };

    const {
      data,
      headers: receivedHeaders,
      status,
    } = await this.client.get<T, AxiosResponse<T, never>, never>(url, options);

    return {
      data,
      // @ts-expect-error - AxiosResponse type is wrong?
      headers: receivedHeaders,
      statusCode: status,
    };
  }

  public static isHttpError(err: unknown): boolean {
    return Axios.isAxiosError(err);
  }
}
