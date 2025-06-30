import { ItemDetails } from './item-details.type';

export type LoaderResponse = {
  count: number;
  inventory: ItemDetails[];
  success: boolean;
};
