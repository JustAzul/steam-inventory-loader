import { ItemDetails } from '../../inventory/types/item-details.type';

export type LoaderResponse = {
  count: number;
  inventory: ItemDetails[];
  success: boolean;
};
