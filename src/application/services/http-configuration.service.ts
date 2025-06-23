import CookieParserService from '@domain/services/cookie-parser.service';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { HttpClient } from '@infra/http-client';
import { injectable, inject } from 'tsyringe';

export interface HttpConfigurationProps {
  appID: string;
  config: LoaderConfig;
  contextID: string;
  steamID64: string;
}

@injectable()
export default class HttpConfigurationService {
  public constructor(
    @inject(CookieParserService)
    private readonly cookieParser: CookieParserService,
  ) {}

  /**
   * Configures HTTP client with appropriate headers and cookies for Steam API requests
   * @param httpClient - The HTTP client instance to configure
   * @param props - Configuration properties
   */
  public async configureHttpClient(
    httpClient: HttpClient,
    props: HttpConfigurationProps,
  ): Promise<void> {
    const { steamID64, appID, contextID, config } = props;

    // Set cookies
    const steamCookies = await this.cookieParser.getSteamCommunityCookies(
      config.SteamCommunity_Jar,
    );
    const contextCookie = this.cookieParser.buildSteamInventoryContextCookie(
      appID,
      contextID,
    );

    const cookieStrings = steamCookies.map((cookie) =>
      this.cookieParser.formatCookie(cookie),
    );
    const allCookies = [contextCookie, ...cookieStrings].join('; ');

    httpClient.setDefaultCookies(allCookies);

    // Set default headers
    httpClient.setDefaultHeaders({
      host: 'steamcommunity.com',
      referer: `https://steamcommunity.com/profiles/${steamID64}/inventory`,
    });
  }
}
