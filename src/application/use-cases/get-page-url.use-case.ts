import { DEFAULT_REQUEST_URL } from '../../shared/constants';

export type GetPageUrlProps = {
  appID: string;
  contextID: string;
  count?: number;
  language?: string;
  lastAssetID?: string;
  steamID64: string;
};

export default class GetPageUrlUseCase {
  public static execute(props: GetPageUrlProps): string {
    const { lastAssetID, language, count, appID, contextID, steamID64 } = props;

    const url = new URL(
      DEFAULT_REQUEST_URL.replace('{steamID64}', steamID64)
        .replace('{appID}', appID)
        .replace('{contextID}', contextID),
    );

    const hasLanguage = Boolean(language) && typeof language === 'string';
    const hasCount = Boolean(count) && typeof count === 'number';

    const hasLastAssetID =
      Boolean(lastAssetID) && typeof lastAssetID === 'string';

    if (hasLanguage) {
      url.searchParams.append('l', language);
    }

    if (hasCount) {
      url.searchParams.append('count', count.toString());
    }

    if (hasLastAssetID) {
      url.searchParams.append('start_assetid', lastAssetID);
    }

    return url.toString();
  }
}
