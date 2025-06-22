import { injectable, inject } from 'tsyringe';
import { HttpClient } from '@infra/http-client';
import CookieParserService from '@domain/services/cookie-parser.service';
import { LoaderConfig } from '@domain/types/loader-config.type';

export interface HttpConfigurationProps {
  steamID64: string;
  appID: string;
  contextID: string;
  config: LoaderConfig;
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
  public configureHttpClient(httpClient: HttpClient, props: HttpConfigurationProps): void {
    const { steamID64, appID, contextID, config } = props;
    
    // Set cookies
    const cookieString = this.cookieParser.buildCookieString(
      config.SteamCommunity_Jar,
      appID,
      contextID
    );
    httpClient.setDefaultCookies(cookieString);
    
    // Set default headers
    httpClient.setDefaultHeaders({
      host: 'steamcommunity.com',
      referer: `https://steamcommunity.com/profiles/${steamID64}/inventory`,
    });
  }
} 