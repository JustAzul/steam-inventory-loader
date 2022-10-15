import { ItemDetails } from './item-details.type';

export type AzulInventoryResponse = {
  success: boolean;
  inventory: ItemDetails[];
  count: number;
};
