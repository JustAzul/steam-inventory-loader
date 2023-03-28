/* eslint-disable camelcase */
import type { InnerItemDescription } from './inner-item-description.type';
import type { ItemActions } from './item-actions.type';
import type { SteamTag } from './steam-tag.type';

export type InventoryPageDescription = {
  actions: ItemActions[];
  appid: number;
  background_color: string;
  classid: string;
  commodity: number;
  currency: number;
  descriptions: InnerItemDescription[];
  fraudwarnings?: unknown[];
  icon_url_large: string;
  icon_url: string;
  instanceid: string;
  item_expiration?: string;
  market_fee_app: number;
  market_hash_name: string;
  market_marketable_restriction: number;
  market_name: string;
  market_tradable_restriction: number;
  marketable: number;
  name: string;
  owner_descriptions?: InnerItemDescription[];
  owner?: unknown;
  tags: SteamTag[];
  tradable: number;
  type: string;
};
