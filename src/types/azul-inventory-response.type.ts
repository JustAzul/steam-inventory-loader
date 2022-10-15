import { ItemDetails } from './item-details.type';

export type AzulInventoryResponse = {
  count: number;
  inventory: ItemDetails[];
  success: boolean;
};
