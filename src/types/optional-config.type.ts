/* eslint-disable camelcase */
import type { CookieJar } from 'tough-cookie';

export type OptionalConfig = {
  Language?: string;
  proxyAddress?: string;
  SteamCommunity_Jar?: CookieJar;
  tradableOnly?: boolean;
  useProxy?: boolean;
};
