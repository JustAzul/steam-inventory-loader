/* eslint-disable camelcase */
import type { ItemAsset } from '../../inventory/types/item-asset.type';
import type { ItemDescription } from '../../inventory/types/item-description.type';

export type SteamBodyResponse = {
  assets: ItemAsset[];
  descriptions: ItemDescription[];
  error?: string;
  Error?: string;
  last_assetid: string;
  more_items?: number;
  rwgrsn: number;
  success: number;
  total_inventory_count: number;
};
