import { ItemDetails } from '../types/item-details.type';

export type LoaderResponseConstructor = {
  itemCount: number;
  items: ItemDetails[];
  success: boolean;
};

export default class LoaderResponse {
  public count: number;

  public inventory: ItemDetails[];

  public success: boolean;

  public constructor(inputs: LoaderResponseConstructor) {
    this.count = inputs.itemCount;
    this.inventory = inputs.items;
    this.success = inputs.success;
  }
}
