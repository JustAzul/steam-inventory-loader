import { InnerItemDescription } from './inner-item-description.type';
import { ItemActions } from './item-actions.type';
import { SteamTag } from './steam-tag.type';

export type ItemDescription = {
  actions: ItemActions[];
  appid: number;
  // eslint-disable-next-line camelcase
  background_color: string;
  classid: string;
  commodity: number;
  currency: number;
  descriptions: InnerItemDescription[];
  // eslint-disable-next-line camelcase
  owner_descriptions?: InnerItemDescription[];
  // eslint-disable-next-line camelcase
  icon_url: string;
  // eslint-disable-next-line camelcase
  icon_url_large: string;
  instanceid: string;
  // eslint-disable-next-line camelcase
  market_fee_app: number;
  // eslint-disable-next-line camelcase
  market_hash_name: string;
  // eslint-disable-next-line camelcase
  market_marketable_restriction: number;
  // eslint-disable-next-line camelcase
  market_name: string;
  // eslint-disable-next-line camelcase
  market_tradable_restriction: number;
  marketable: number;
  name: string;
  tags: SteamTag[];
  tradable: number;
  owner?: any;
  type: string;
  // eslint-disable-next-line camelcase
  item_expiration?: string;
  [ListingKey: string]: any;
};
