import {
  DEFAULT_REQUEST_URL,
  PLACEHOLDER_APP_ID,
  PLACEHOLDER_CONTEXT_ID,
  PLACEHOLDER_STEAM_ID_64,
} from '../../shared/constants';

import ValidateEndpointUseCase from './validate-endpoint.use-case';

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
  private readonly props: GetPageUrlProps;

  public constructor(props: Readonly<GetPageUrlProps>) {
    this.props = props;
  }

  public execute(): string {
    const {
      appID,
      contextID,
      count,
      customEndpoint,
      language,
      lastAssetID,
      steamID64,
    } = this.props;

    const hasCustomEndpoint =
      Boolean(customEndpoint) && typeof customEndpoint === 'string';

    const endpoint: string = hasCustomEndpoint
      ? customEndpoint
      : DEFAULT_REQUEST_URL;

    const validateEndpointUseCase = new ValidateEndpointUseCase({ endpoint });
    validateEndpointUseCase.execute();

    const url = new URL(
      endpoint
        .replace(PLACEHOLDER_APP_ID, appID)
        .replace(PLACEHOLDER_CONTEXT_ID, contextID)
        .replace(PLACEHOLDER_STEAM_ID_64, steamID64),
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
}
