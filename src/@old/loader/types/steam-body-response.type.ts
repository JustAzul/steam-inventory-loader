/* eslint-disable camelcase */
import type { ItemAsset } from '../../../domain/types/item-asset.type';
import type { ItemDescription } from '../../../domain/types/item-description.type';

export type SteamSupplyBodyResponse = {
  fake_redirect?: number;
};

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
} & Partial<SteamSupplyBodyResponse>;
