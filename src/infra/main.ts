import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import {
  GetInventoryPageResultInterfaces,
  GetInventoryPageResultProps,
} from '@application/use-cases/get-inventory-page-result.use-case';
import GetInventoryPageResultUseCase from '@application/use-cases/get-inventory-page-result.use-case';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { LoaderConfig } from '@domain/types/loader-config.type';
import FetchWithDelayUseCase from '@application/use-cases/fetch-with-delay.use-case';
import { HttpClient } from './http-client';
import LoaderUtils from './loader-utils';

export default class AzulSteamInventoryLoader
  extends LoaderUtils
  implements IAzulSteamInventoryLoader
{
  /**
   * Loads a user's inventory from Steam.
   *
   * @remarks
   * This method requires valid Steam session cookies to reliably fetch inventories.
   * Unauthenticated requests are frequently blocked by Steam, resulting in errors.
   *
   * @param steamID64 - The 64-bit Steam ID of the user.
   * @param appID - The ID of the application (game).
   * @param contextID - The ID of the context within the application.
   * @param config - The configuration object for the loader.
   * @param config.SteamCommunity_Jar - A `tough-cookie` CookieJar instance containing valid `sessionid` and `steamLoginSecure` cookies for steamcommunity.com.
   * @param config.language - The language for item descriptions (e.g., 'english').
   * @param config.itemsPerPage - The number of items to fetch per page (max 5000).
   * @param config.requestDelay - The delay in milliseconds between requests.
   * @param config.proxyAddress - The address of a proxy to use for requests.
   *
   * @returns A promise that resolves to an array of SteamItemEntity instances.
   *
   * @example
   * ```
   * import { CookieJar } from 'tough-cookie';
   * import AzulSteamInventoryLoader from 'azul-steam-inventory-loader';
   *
   * const cookieJar = new CookieJar();
   * cookieJar.setCookie('sessionid=YOUR_SESSION_ID', 'https://steamcommunity.com');
   * cookieJar.setCookie('steamLoginSecure=YOUR_LOGIN_SECURE_TOKEN', 'https://steamcommunity.com');
   *
   * const config = { SteamCommunity_Jar: cookieJar };
   * const inventory = await AzulSteamInventoryLoader.Loader('76561197994150794', '730', '2', config);
   * console.log(inventory);
   * ```
   */
  public static async Loader(
    steamID64: string,
    appID: string,
    contextID: string,
    config: LoaderConfig,
  ): Promise<SteamItemEntity[]> {
    const httpClient = new HttpClient(config.proxyAddress);

    httpClient.setDefaultHeaders({
      host: 'steamcommunity.com',
      referer: `https://steamcommunity.com/profiles/${steamID64}/inventory`,
    });

    const cookies: string[] = [`strInventoryLastContext=${appID}_${contextID}`];

    if (config.SteamCommunity_Jar) {
      cookies.push(...LoaderUtils.parseCookies(config.SteamCommunity_Jar));
    }

    httpClient.setDefaultCookies(cookies.join('; '));

    const fetcher = new FetchWithDelayUseCase({
      interfaces: { httpClient },
      props: {
        delayInMilliseconds: config.requestDelay ?? 300,
      },
    });

    const allItems: SteamItemEntity[] = [];
    let lastAssetID: string | undefined;
    let moreItems = true;

    do {
      const useCaseProps: GetInventoryPageResultProps = {
        appID,
        contextID,
        steamID64,
        count: config.itemsPerPage ?? 5000,
        language: config.Language ?? 'english',
        lastAssetID,
      };

      const useCaseInterfaces: GetInventoryPageResultInterfaces = {
        fetchUrlUseCase: fetcher,
      };

      const getInventoryPage = new GetInventoryPageResultUseCase({
        interfaces: useCaseInterfaces,
        props: useCaseProps,
      });

      const pageResult = await getInventoryPage.execute();

      if (pageResult?.assets && pageResult?.descriptions) {
        const descriptionsMap = pageResult.descriptions.reduce(
          (acc, desc) => {
            const key = `${desc.classid}_${desc.instanceid}`;
            acc[key] = desc;
            return acc;
          },
          {} as Record<string, typeof pageResult.descriptions[0]>,
        );

        for (const asset of pageResult.assets) {
          const key = `${asset.classid}_${asset.instanceid}`;
          const description = descriptionsMap[key];
          if (description) {
            const item = new SteamItemEntity({ asset, description });
            allItems.push(item);
          }
        }
      }

      moreItems = !!pageResult?.more_items;
      lastAssetID = pageResult?.last_assetid;
    } while (moreItems);

    if (config.tradableOnly) {
      return allItems.filter((item) => item.tradable);
    }

    return allItems;
  }
}
