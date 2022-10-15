/* eslint-disable camelcase */
import { ItemAsset } from './item-asset.type';
import { ItemDescription } from './item-description.type';

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
