import { DEFAULT_REQUEST_URL } from '../../shared/constants';
import UseCaseException from '../exceptions/use-case.exception';

export type GetPageUrlProps = {
  appID: string;
  contextID: string;
  count?: number;
  customEndpoint?: string;
  language?: string;
  lastAssetID?: string;
  steamID64: string;
};

export default class GetPageUrlUseCase {
  public static execute(props: GetPageUrlProps): string {
    const {
      appID,
      contextID,
      count,
      customEndpoint,
      steamID64,
      language,
      lastAssetID,
    } = props;

    const hasCustomEndpoint =
      Boolean(customEndpoint) && typeof customEndpoint === 'string';

    const endpoint: string = hasCustomEndpoint
      ? customEndpoint
      : DEFAULT_REQUEST_URL;

    GetPageUrlUseCase.ValidateEndpoint(endpoint);

    const url = new URL(
      endpoint
        .replace('{appID}', appID)
        .replace('{contextID}', contextID)
        .replace('{steamID64}', steamID64),
    );

    const hasCount = Boolean(count) && typeof count === 'number';
    const hasLanguage = Boolean(language) && typeof language === 'string';

    const hasLastAssetID =
      Boolean(lastAssetID) && typeof lastAssetID === 'string';

    if (hasCount) {
      url.searchParams.append('count', String(count));
    }

    if (hasLanguage) {
      url.searchParams.append('l', language);
    }

    if (hasLastAssetID) {
      url.searchParams.append('start_assetid', lastAssetID);
    }

    return url.toString();
  }

  private static ValidateEndpoint(endpoint: string): void {
    const containsAppID = endpoint.includes('{appID}');
    const containsContextID = endpoint.includes('{contextID}');
    const containsSteamID64 = endpoint.includes('{steamID64}');

    const containsHttp = endpoint.includes('http://');
    const containsHttps = endpoint.includes('https://');

    if (containsHttp === false && containsHttps === false) {
      throw new UseCaseException(
        GetPageUrlUseCase.name,
        `The custom endpoint must contain the 'http://' or 'https://' protocol.`,
      );
    }

    if (containsSteamID64 === false) {
      throw new UseCaseException(
        GetPageUrlUseCase.name,
        `The custom endpoint must contain the '{steamID64}' placeholder.`,
      );
    }

    if (containsAppID === false) {
      throw new UseCaseException(
        GetPageUrlUseCase.name,
        `The custom endpoint must contain the '{appID}' placeholder.`,
      );
    }

    if (containsContextID === false) {
      throw new UseCaseException(
        GetPageUrlUseCase.name,
        `The custom endpoint must contain the '{contextID}' placeholder.`,
      );
    }
  }
}
