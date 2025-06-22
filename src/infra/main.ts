import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import GetHttpResponseWithExceptionUseCase from '@application/use-cases/get-http-response-with-exception.use-case';
import GetInventoryPageResultUseCase from '@application/use-cases/get-inventory-page-result.use-case';
import GetPageUrlUseCase from '@application/use-cases/get-page-url.use-case';
import LoadInventoryUseCase from '@application/use-cases/load-inventory.use-case';
import MapAssetsToSteamItemsUseCase from '@application/use-cases/map-assets-to-steam-items.use-case';
import ProcessHttpExceptionsUseCase from '@application/use-cases/process-http-exceptions.use-case';
import ProcessSteamErrorResultUseCase from '@application/use-cases/process-steam-error-result.use-case';
import ValidateEndpointUseCase from '@application/use-cases/validate-endpoint.use-case';
import ValidateHttpResponseUseCase from '@application/use-cases/validate-http-response.use-case';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { LoaderConfig } from '@domain/types/loader-config.type';
import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '@shared/constants';
import { HttpClient } from './http-client';
import { parseCookies } from './loader-utils';
import { ResilientHttpFetcher } from './ResilientHttpFetcher';

export default class AzulSteamInventoryLoader
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
    // 1. Instantiate Infrastructure
    const httpClient = new HttpClient(config.proxyAddress);
    const resilientFetcher = new ResilientHttpFetcher(httpClient, {
      maxRetries: config.maxRetries,
    });

    // 2. Setup Headers and Cookies
    httpClient.setDefaultHeaders({
      host: 'steamcommunity.com',
      referer: `https://steamcommunity.com/profiles/${steamID64}/inventory`,
    });
    const cookies: string[] = [`strInventoryLastContext=${appID}_${contextID}`];
    if (config.SteamCommunity_Jar) {
      cookies.push(...parseCookies(config.SteamCommunity_Jar));
    }
    httpClient.setDefaultCookies(cookies.join('; '));

    // 3. Instantiate Leaf Use Cases (no dependencies)
    const validateEndpointUseCase = new ValidateEndpointUseCase();
    const processSteamErrorResultUseCase = new ProcessSteamErrorResultUseCase();
    const processHttpExceptionsUseCase = new ProcessHttpExceptionsUseCase();
    const mapAssetsToSteamItemsUseCase = new MapAssetsToSteamItemsUseCase();

    // 4. Instantiate Composite Use Cases (with dependencies)
    const getPageUrlUseCase = new GetPageUrlUseCase(validateEndpointUseCase);
    const validateHttpResponseUseCase = new ValidateHttpResponseUseCase(
      processSteamErrorResultUseCase,
    );
    const getHttpResponseUseCase = new GetHttpResponseWithExceptionUseCase({
      fetcher: resilientFetcher,
      processHttpExceptionsUseCase,
      validateHttpResponseUseCase,
    });

    const getInventoryPageResultUseCase = new GetInventoryPageResultUseCase({
      getHttpResponseUseCase,
      getPageUrlUseCase,
      props: {
        appID,
        contextID,
        steamID64,
        count: config.itemsPerPage ?? DEFAULT_REQUEST_ITEM_COUNT,
        language: config.Language ?? DEFAULT_REQUEST_LANGUAGE,
      },
    });

    const loadInventoryUseCase = new LoadInventoryUseCase({
      props: { steamID64, appID, contextID, config },
      interfaces: {
        getInventoryPage: getInventoryPageResultUseCase,
        mapAssetsToSteamItems: mapAssetsToSteamItemsUseCase,
      },
    });

    // 5. Execute the top-level use case
    return loadInventoryUseCase.execute();
  }
}
