import { CookieJar } from 'tough-cookie';
import type steamID from 'steamid';

export type InventoryLoaderConstructor = {
  language?: string;
  proxyAddress?: string;
  steamCommunityJar?: CookieJar;
  tradableOnly?: boolean;
  useProxy?: boolean;
  appID: string | number;
  contextID: string | number;
  steamID64: string | steamID;
};
