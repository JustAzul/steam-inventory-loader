/* eslint-disable camelcase */
import type { InnerItemDescription } from './inner-item-description.type';
import type { ItemActions } from './item-actions.type';
import type { rawTag } from './raw-tag.type';

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
  icon_url: string;
  icon_url_large: string;
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
  owner?: unknown;
  owner_actions?: ItemActions[];
  owner_descriptions?: InnerItemDescription[];
  tags?: rawTag[];
  tradable: boolean;
  type: string;
};
