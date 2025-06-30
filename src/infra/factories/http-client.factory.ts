import { Agent as HttpsAgent } from 'https';

import Axios, { AxiosInstance, CreateAxiosDefaults } from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { HttpsProxyAgent } from 'hpagent';
import { CookieJar } from 'tough-cookie';

import { DEFAULT_REQUEST_TIMEOUT } from '@application/constants';

export type HttpClientFactoryProps = {
  proxyAddress?: string;
  cookies?: string;
};

export class HttpClientFactory {
  public static create({
    proxyAddress,
  }: HttpClientFactoryProps): AxiosInstance {
    const proxyAgent = this.createProxyAgent(proxyAddress);
    const client = Axios.create(this.getClientConstructor(proxyAgent));
    wrapper(client);
    return client;
  }

  private static getClientConstructor(
    proxyAgent?: HttpsProxyAgent,
  ): CreateAxiosDefaults {
    return {
      httpsAgent: proxyAgent ?? new HttpsAgent(),
      jar: new CookieJar(),
      responseType: 'json',
      timeout: DEFAULT_REQUEST_TIMEOUT,
      validateStatus: (statusCode) => statusCode >= 200 && statusCode < 300,
      withCredentials: true,
    };
  }

  private static createProxyAgent(
    proxyAddress?: string,
  ): HttpsProxyAgent | undefined {
    if (
      proxyAddress !== undefined &&
      proxyAddress !== null &&
      proxyAddress !== ''
    ) {
      return new HttpsProxyAgent({
        keepAlive: true,
        proxy: proxyAddress,
      });
    }
    return undefined;
  }

  private static getProxyAgent(proxy?: {
    host?: string;
    port?: number;
  }): HttpsProxyAgent | undefined {
    const { host, port } = proxy ?? {};
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!host || !port || port <= 0) {
      return undefined;
    }

    return new HttpsProxyAgent({
      proxy: `http://${host}:${port}`,
    });
  }
}
