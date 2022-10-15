import type { CookieJar } from 'tough-cookie';

export type OptionalConfig = {
  // eslint-disable-next-line camelcase, @typescript-eslint/no-explicit-any
  Language?: string;
  proxyAddress?: string;
  SteamCommunity_Jar?: CookieJar;
  tradableOnly?: boolean;
  useProxy?: boolean;
};
