import GetHttpResponseWithExceptionUseCase from '@application/use-cases/get-http-response-with-exception.use-case';
import GetInventoryPageResultUseCase from '@application/use-cases/get-inventory-page-result.use-case';
import GetPageUrlUseCase from '@application/use-cases/get-page-url.use-case';
import LoadInventoryUseCase from '@application/use-cases/load-inventory.use-case';
import MapAssetsToSteamItemsUseCase from '@application/use-cases/map-assets-to-steam-items.use-case';
import ProcessHttpExceptionsUseCase from '@application/use-cases/process-http-exceptions.use-case';
import ProcessSteamErrorResultUseCase from '@application/use-cases/process-steam-error-result.use-case';
import ValidateEndpointUseCase from '@application/use-cases/validate-endpoint.use-case';
import ValidateHttpResponseUseCase from '@application/use-cases/validate-http-response.use-case';
import FindCardBorderTypeUseCase from '@application/use-cases/find-card-border-type.use-case';
import FindTagUseCase from '@application/use-cases/find-tag.use-case';
import GetImageUrlUseCase from '@application/use-cases/get-image-url.use-case';
import { LoaderConfig } from '@domain/types/loader-config.type';
import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '@shared/constants';
import { HttpClient } from './http-client';
import { ResilientHttpFetcher } from './ResilientHttpFetcher';
import { Cookie } from '@domain/types/cookie.type';
import { CookieJar } from 'tough-cookie';

export class DIContainer {
  private readonly config: LoaderConfig;
  private readonly httpClient: HttpClient;
  private readonly resilientFetcher: ResilientHttpFetcher;

  constructor(config: LoaderConfig) {
    this.config = config;
    this.httpClient = new HttpClient(this.config.proxyAddress);
    this.resilientFetcher = new ResilientHttpFetcher(this.httpClient, {
      maxRetries: this.config.maxRetries,
    });
  }

  public getLoadInventoryUseCase(
    steamID64: string,
    appID: string,
    contextID: string,
  ): LoadInventoryUseCase {
    this.setupHttpClients(steamID64, appID, contextID);

    const validateEndpointUseCase = new ValidateEndpointUseCase();
    const processSteamErrorResultUseCase = new ProcessSteamErrorResultUseCase();
    const processHttpExceptionsUseCase = new ProcessHttpExceptionsUseCase();
    const mapAssetsToSteamItemsUseCase = new MapAssetsToSteamItemsUseCase();

    const getPageUrlUseCase = new GetPageUrlUseCase(validateEndpointUseCase);
    const validateHttpResponseUseCase = new ValidateHttpResponseUseCase(
      processSteamErrorResultUseCase,
    );
    const getHttpResponseUseCase = new GetHttpResponseWithExceptionUseCase({
      fetcher: this.resilientFetcher,
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
        count: this.config.itemsPerPage ?? DEFAULT_REQUEST_ITEM_COUNT,
        language: this.config.Language ?? DEFAULT_REQUEST_LANGUAGE,
      },
    });

    return new LoadInventoryUseCase({
      props: { steamID64, appID, contextID, config: this.config },
      interfaces: {
        getInventoryPage: getInventoryPageResultUseCase,
        mapAssetsToSteamItems: mapAssetsToSteamItemsUseCase,
      },
    });
  }

  private setupHttpClients(
    steamID64: string,
    appID: string,
    contextID: string,
  ): void {
    this.httpClient.setDefaultHeaders({
      host: 'steamcommunity.com',
      referer: `https://steamcommunity.com/profiles/${steamID64}/inventory`,
    });
    const cookies: string[] = [`strInventoryLastContext=${appID}_${contextID}`];
    if (this.config.SteamCommunity_Jar) {
      cookies.push(
        ...this.parseCookies(this.config.SteamCommunity_Jar),
      );
    }
    this.httpClient.setDefaultCookies(cookies.join('; '));
  }

  public getFindCardBorderTypeUseCase(): FindCardBorderTypeUseCase {
    return new FindCardBorderTypeUseCase();
  }

  public getFindTagUseCase(): FindTagUseCase {
    return new FindTagUseCase();
  }

  public getGetImageUrlUseCase(): GetImageUrlUseCase {
    return new GetImageUrlUseCase();
  }

  private parseCookies(jarLikeInput?: CookieJar): string[] {
    if (!jarLikeInput) return [];

    // eslint-disable-next-line no-underscore-dangle
    if ('_jar' in jarLikeInput)
      return this.parseCookies(jarLikeInput._jar as CookieJar);

    const result = (jarLikeInput.serializeSync().cookies as Cookie[])
      .filter(({ domain }) => domain === 'steamcommunity.com')
      .map(({ key, value }) => `${key}=${value};`);

    return result;
  }
} 