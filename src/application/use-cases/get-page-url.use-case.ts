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

export type GetPageUrlResult = {
  url: string;
  params: Record<string, string | number>;
};

export default class GetPageUrlUseCase {
  private readonly props: GetPageUrlProps;

  public constructor(props: Readonly<GetPageUrlProps>) {
    this.props = props;
  }

  public execute(): GetPageUrlResult {
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

    const url = endpoint
      .replace(PLACEHOLDER_APP_ID, appID)
      .replace(PLACEHOLDER_CONTEXT_ID, contextID)
      .replace(PLACEHOLDER_STEAM_ID_64, steamID64);

    const params: Record<string, string | number> = {};

    const hasCount = Boolean(count);
    const hasLanguage = Boolean(language);
    const hasLastAssetID = Boolean(lastAssetID);

    if (hasCount && typeof count !== 'undefined') {
      params.count = count;
    }

    if (hasLanguage && typeof language !== 'undefined') {
      params.l = language;
    }

    if (hasLastAssetID && typeof lastAssetID !== 'undefined') {
      params.start_assetid = lastAssetID;
    }

    return { url, params };
  }
}
