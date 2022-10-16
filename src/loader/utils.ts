import type { Cookie } from './types/cookie.type';
import { HttpsAgent } from 'agentkeepalive';
import { HttpsProxyAgent } from 'hpagent';
import type { InventoryLoaderConstructor } from './types/inventory-loader-constructor.type';

export default class LoaderUtils {
  private static readonly defaultAgent = new HttpsAgent();

  public static getAgent(proxyAddress?: string): HttpsProxyAgent | HttpsAgent {
    if (proxyAddress) {
      const ProxyAgent = new HttpsProxyAgent({
        keepAlive: true,
        proxy: proxyAddress,
      });

      return ProxyAgent;
    }

    return LoaderUtils.defaultAgent;
  }

  public static parseCookies(
    jarLikeInput?: InventoryLoaderConstructor['steamCommunityJar'],
  ): string {
    if (!jarLikeInput) return '';

    if ('_jar' in jarLikeInput) {
      // eslint-disable-next-line no-underscore-dangle
      return LoaderUtils.parseCookies(jarLikeInput._jar);
    }

    const result = (jarLikeInput.serializeSync().cookies as Cookie[])
      .filter(({ domain }) => domain === 'steamcommunity.com')
      .map(({ key, value }) => `${key}=${value};`)
      .join(' ');

    return result;
  }
}
