/* eslint-disable camelcase */
import type { CookieJar } from 'tough-cookie';

export type OptionalConfig = {
  customEndpoint?: string;
  itemsPerPage?: number;
  Language?: string;
  maxRetries?: number;
  proxyAddress?: string;
  requestDelay?: number;
  steamApisKey?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SteamCommunity_Jar?: CookieJar;
  steamSupplyKey?: string;
  tradableOnly?: boolean;
  useProxy?: boolean;
};

export type InnerItemDescription = {
  value: string;
};

export type ItemActions = {
  link: string;
  name: string;
};

export type Tag = {
  category_name: string;
  category: string;
  color: string;
  internal_name: string;
  name: string;
};

export type ItemDetails = {
  actions: ItemActions[];
  amount: number;
  appid: number;
  assetid: string;
  background_color: string;
  cache_expiration?: string;
  classid: string;
  commodity: boolean;
  contextid: string;
  currency: number;
  descriptions: InnerItemDescription[];
  fraudwarnings: unknown[];
  icon_url_large: string;
  icon_url: string;
  id: string;
  instanceid: string;
  is_currency: boolean;
  item_expiration?: string;
  market_fee_app?: number;
  market_hash_name: string;
  market_marketable_restriction: number;
  market_name: string;
  market_tradable_restriction: number;
  marketable: boolean;
  name: string;
  owner_actions?: ItemActions[];
  owner_descriptions?: InnerItemDescription[];
  owner?: unknown;
  tags?: Tag[];
  tradable: boolean;
  type: string;
};

export type LoaderResponse = {
  count: number;
  inventory: ItemDetails[];
  success: boolean;
}; 