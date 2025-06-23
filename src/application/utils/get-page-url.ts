import {
  DEFAULT_REQUEST_URL,
  PLACEHOLDER_APP_ID,
  PLACEHOLDER_CONTEXT_ID,
  PLACEHOLDER_STEAM_ID_64,
} from '@domain/constants';

import { validateEndpoint } from './validate-endpoint';

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
  params: Record<string, string | number>;
  url: string;
};

export const getPageUrl = (props: GetPageUrlProps): GetPageUrlResult => {
  const {
    appID,
    contextID,
    count,
    customEndpoint,
    language,
    lastAssetID,
    steamID64,
  } = props;

  const hasCustomEndpoint =
    Boolean(customEndpoint) && typeof customEndpoint === 'string';

  const endpoint: string = hasCustomEndpoint
    ? customEndpoint
    : DEFAULT_REQUEST_URL;

  validateEndpoint(endpoint);

  const url = endpoint
    .replaceAll(PLACEHOLDER_APP_ID, appID)
    .replaceAll(PLACEHOLDER_CONTEXT_ID, contextID)
    .replaceAll(PLACEHOLDER_STEAM_ID_64, steamID64);

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

  return { params, url };
}; 