/* eslint-disable camelcase */
import type { CookieJar } from 'tough-cookie';

export type LoaderConfig = {
  SteamCommunity_Jar: CookieJar;
  Language?: string;
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
