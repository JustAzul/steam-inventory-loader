/* eslint-disable camelcase */
import type { CookieJar } from 'tough-cookie';

export type OptionalConfig = {
  Language?: string;
  maxRetries?: number;
  proxyAddress?: string;
  SteamCommunity_Jar?: CookieJar;
  tradableOnly?: boolean;
  useProxy?: boolean;
};
