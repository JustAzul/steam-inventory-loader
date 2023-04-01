import { DEFAULT_REQUEST_URL } from '../../shared/constants';
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
      steamID64,
      language,
      lastAssetID,
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
}
