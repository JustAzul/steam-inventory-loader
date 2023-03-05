/* eslint-disable camelcase */
export type SteamRequestParams = {
  count?: number;
  l: string;
  start_assetid?: string;
};

export type SteamApisRequestParams = {
  api_key: string;
};

export type SteamSupplyRequestParams = {
  appid: number;
  contextid: number;
  start_assetid?: string;
  steamid: string;
};

export type RequestParams = SteamRequestParams &
  Partial<SteamApisRequestParams> &
  Partial<SteamSupplyRequestParams>;
