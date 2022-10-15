import { ItemAsset } from './item-asset.type';
import { ItemDescription } from './item-description.type';

export type SteamBodyResponse = {
  error?: string;
  Error?: string;
  assets: ItemAsset[];
  descriptions: ItemDescription[];
  // eslint-disable-next-line camelcase
  more_items?: number;
  // eslint-disable-next-line camelcase
  last_assetid: string;
  // eslint-disable-next-line camelcase
  total_inventory_count: number;
  success: number;
  rwgrsn: number;
};
