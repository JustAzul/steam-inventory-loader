/* eslint-disable camelcase */
import { InventoryPageAsset } from '../../domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '../../domain/types/inventory-page-description.type';

export type InventoryPageResult = {
  assets: InventoryPageAsset[];
  descriptions: InventoryPageDescription[];
  error?: string;
  Error?: string;
  last_assetid?: string;
  more_items?: number;
  rwgrsn: number;
  success: number;
  total_inventory_count: number;
};
