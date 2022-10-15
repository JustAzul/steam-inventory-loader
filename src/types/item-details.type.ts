import { InnerItemDescription } from './inner-item-description.type';
import { ItemActions } from './item-actions.type';
import { Tag } from './tag.type';

export type ItemDetails = {
  id: string;

  // eslint-disable-next-line camelcase
  is_currency: boolean;
  instanceid: string;
  amount: number;
  contextid: string;

  appid: number;
  assetid: string;
  classid: string;
  // pos: number,

  tradable: boolean;
  marketable: boolean;
  commodity: boolean;

  fraudwarnings: unknown[];
  descriptions: InnerItemDescription[];
  // eslint-disable-next-line camelcase
  owner_descriptions?: InnerItemDescription[];

  // eslint-disable-next-line camelcase
  market_hash_name: string;
  // eslint-disable-next-line camelcase
  market_tradable_restriction: number;
  // eslint-disable-next-line camelcase
  market_marketable_restriction: number;
  // eslint-disable-next-line camelcase
  market_fee_app?: number;

  // eslint-disable-next-line camelcase
  cache_expiration?: string;
  // eslint-disable-next-line camelcase
  item_expiration?: string;

  tags?: Tag[];
  actions: ItemActions[];

  // eslint-disable-next-line camelcase
  owner_actions?: ItemActions[];

  // descs

  // eslint-disable-next-line camelcase
  background_color: string;
  currency: number;
  // eslint-disable-next-line camelcase
  icon_url: string;
  // eslint-disable-next-line camelcase
  icon_url_large: string;

  // eslint-disable-next-line camelcase
  market_name: string;
  name: string;
  type: string;
  owner?: unknown;
};
