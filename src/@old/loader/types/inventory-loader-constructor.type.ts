import type steamID from 'steamid';
import type { CookieJar } from 'tough-cookie';

export type JarLike = {
  _jar: CookieJar;
};

export type InventoryLoaderConstructor = {
  appID: string | number;
  contextID: string | number;
  customEndpoint?: string;
  itemsPerPage?: number;
  language?: string;
  maxRetries?: number;
  proxyAddress?: string;
  requestDelay?: number;
  steamApisKey?: string;
  steamCommunityJar?: CookieJar | JarLike;
  steamID64: string | steamID;
  steamSupplyKey?: string;
  tradableOnly?: boolean;
  useProxy?: boolean;
};
