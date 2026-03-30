/* eslint-disable camelcase */
import type { InnerItemDescription } from './inner-item-description.type';
import type { ItemActions } from './item-actions.type';
import type { Tag } from './tag.type';

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
