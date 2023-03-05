import { ItemDetails } from '../../../domain/types/item-details.type';

export type LoaderResponse = {
  count: number;
  inventory: ItemDetails[];
  success: boolean;
};
