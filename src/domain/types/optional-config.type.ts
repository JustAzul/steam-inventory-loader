/* eslint-disable camelcase */
import type { CookieJar } from 'tough-cookie';

export type OptionalConfig = {
  Language?: string;
  SteamCommunity_Jar?: CookieJar;
  customEndpoint?: string;
  itemsPerPage?: number;
  maxRetries?: number;
  proxyAddress?: string;
  requestDelay?: number;
  steamApisKey?: string;
  steamSupplyKey?: string;
  tradableOnly?: boolean;
  useProxy?: boolean;
};
