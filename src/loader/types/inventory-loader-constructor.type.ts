import type { CookieJar } from 'tough-cookie';
import type steamID from 'steamid';

export type InventoryLoaderConstructor = {
  appID: string | number;
  contextID: string | number;
  language?: string;
  maxRetries?: number;
  proxyAddress?: string;
  steamCommunityJar?: CookieJar | { _jar: CookieJar };
  steamID64: string | steamID;
  tradableOnly?: boolean;
  useProxy?: boolean;
};
