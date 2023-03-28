/* eslint-disable camelcase */
import type { InventoryPageAsset } from '../../../domain/types/inventory-page-asset.type';
import type { InventoryPageDescription } from '../../../domain/types/inventory-page-description.type';

export type SteamSupplyBodyResponse = {
  fake_redirect?: number;
};

export type SteamBodyResponse = {
  assets: InventoryPageAsset[];
  descriptions: InventoryPageDescription[];
  error?: string;
  Error?: string;
  last_assetid: string;
  more_items?: number;
  rwgrsn: number;
  success: number;
  total_inventory_count: number;
} & Partial<SteamSupplyBodyResponse>;
