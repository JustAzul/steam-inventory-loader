import Axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';

import { DEFAULT_REQUEST_TIMEOUT } from '../constants';
import { HttpsAgent } from 'agentkeepalive';
import { HttpsProxyAgent } from 'hpagent';
import { IncomingHttpHeaders } from 'http';
import { RequestParams } from './types/request-params.type';
import { SteamBodyResponse } from './types/steam-body-response.type';

export default class HttpClient {
  private client: AxiosInstance;

  private cookies?: string;

  private defaultHeaders?: IncomingHttpHeaders;

  private proxyAgent?: HttpsProxyAgent;

  private static readonly defaultAgent: HttpsAgent = new HttpsAgent();

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
    return this?.proxyAgent || HttpClient.defaultAgent;
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

  public setProxy(proxyUrl: string): this {
    this.destroy();

    this.proxyAgent = new HttpsProxyAgent({
      keepAlive: true,
      proxy: proxyUrl,
    });

    this.client = Axios.create(this.getClientConstructor());

    return this;
  }

  public async get(
    url: string,
    params: RequestParams,
  ): Promise<SteamBodyResponse> {
    const options: AxiosRequestConfig<never> = {
      params,
    };

    const {
      data,
    }: AxiosResponse<SteamBodyResponse, never> & { data: SteamBodyResponse } =
      await this.client.get<
        SteamBodyResponse,
        AxiosResponse<SteamBodyResponse, never>,
        never
      >(url, options);

    return data;
  }

  public static isRequestError(err: unknown): boolean {
    return Axios.isAxiosError(err);
  }
}
