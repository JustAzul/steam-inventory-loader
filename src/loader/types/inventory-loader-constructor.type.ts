import type { CookieJar } from 'tough-cookie';
import type steamID from 'steamid';

export type InventoryLoaderConstructor = {
  appID: string | number;
  contextID: string | number;
  itemsPerPage?: number;
  language?: string;
  maxRetries?: number;
  proxyAddress?: string;
  requestDelay?: number;
  steamApisKey?: string;
  steamCommunityJar?: CookieJar | { _jar: CookieJar };
  steamID64: string | steamID;
  steamSupplyKey?: string;
  tradableOnly?: boolean;
  useProxy?: boolean;
};
