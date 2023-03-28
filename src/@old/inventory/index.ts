import type { InventoryConstructor } from './types/inventory-constructor.type';
import type { InventoryPageAsset } from '../../domain/types/inventory-page-asset.type';
import type { InventoryPageDescription } from '../../domain/types/inventory-page-description.type';
import InventoryUtils from './utils';
import type { ItemDetails } from '../../domain/types/item-details.type';

export default class Inventory {
  private readonly contextID: string;

  private readonly descriptions: Map<string, InventoryPageDescription> = new Map();

  private readonly tradableOnly: boolean;

  public readonly items: ItemDetails[] = [];

  constructor({ contextID, tradableOnly }: InventoryConstructor) {
    this.contextID = contextID;
    this.tradableOnly = tradableOnly;
  }

  public updateDescriptions(itemDescriptions: InventoryPageDescription[]): void {
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

  public insertItems(itemAssets: InventoryPageAsset[]): void {
    for (let i = 0; i < itemAssets.length; i += 1) {
      const itemAsset = itemAssets[i];

      if (itemAsset?.currencyid) {
        if (process.env.NODE_ENV === 'development')
          // eslint-disable-next-line no-console
          console.debug('found item with currencyid');

        // eslint-disable-next-line no-continue
        continue;
      }

      const descriptionKey = InventoryUtils.findDescriptionKey(itemAsset);
      const description = this.descriptions.get(descriptionKey);

      if (!description) {
        if (process.env.NODE_ENV === 'development')
          // eslint-disable-next-line no-console
          console.debug('found item without description');

        // eslint-disable-next-line no-continue
        continue;
      }

      if (this.tradableOnly && Boolean(description?.tradable) === false) {
        // eslint-disable-next-line no-continue
        continue;
      }

      this.insertItem(
        InventoryUtils.parseItem({
          contextID: this.contextID,
          description,
          item: itemAsset,
        }),
      );
    }
  }

  public getInventory(): ItemDetails[] {
    return this.items;
  }
}
