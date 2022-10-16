import type { InventoryConstructor } from './types/inventory-constructor.type';
import InventoryUtils from './utils';
import type { ItemAsset } from './types/item-asset.type';
import type { ItemDescription } from './types/item-description.type';
import type { ItemDetails } from './types/item-details.type';

export default class Inventory {
  private readonly contextID: string;

  private readonly descriptions: Map<string, ItemDescription> = new Map();

  private readonly tradableOnly: boolean;

  public readonly items: ItemDetails[] = [];

  constructor({ contextID, tradableOnly }: InventoryConstructor) {
    this.contextID = contextID;
    this.tradableOnly = tradableOnly;
  }

  public updateDescriptions(itemDescriptions: ItemDescription[]): void {
    for (let i = 0; i < itemDescriptions.length; i += 1) {
      const itemDescription = itemDescriptions[i];
      const descriptionKey = InventoryUtils.findDescriptionKey(itemDescription);

      if (!this.descriptions.has(descriptionKey)) {
        this.descriptions.set(descriptionKey, itemDescription);
      }
    }
  }

  public clearCache(): void {
    process.nextTick(() => {
      this.descriptions.clear();
      if (global?.gc) global.gc();
    });
  }

  private insertItem(item: ItemDetails): void {
    this.items.push(item);
  }

  public insertItems(itemAssets: ItemAsset[]): void {
    for (let i = 0; i < itemAssets.length; i += 1) {
      const itemAsset = itemAssets[i];

      if (!itemAsset.currencyid) {
        const descriptionKey = InventoryUtils.findDescriptionKey(itemAsset);
        const description = this.descriptions.get(descriptionKey);

        if (!this.tradableOnly || (description && description?.tradable)) {
          if (description) {
            this.insertItem(
              InventoryUtils.parseItem({
                contextID: this.contextID,
                description,
                item: itemAsset,
              }),
            );
          }
        }
      }
    }
  }

  public getInventory(): ItemDetails[] {
    return this.items;
  }
}
