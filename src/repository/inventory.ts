import type { IInventoryRepository, InventoryPage, ItemDetails, ParseConfig } from '../types.js';
import { DescriptionStore } from './description-store.js';
import { buildItem } from '../pipeline/item-builder.js';
import { shouldInclude } from '../pipeline/filter.js';
import { selectFields } from '../pipeline/field-selector.js';

/**
 * In-memory inventory repository (FR07, FR18-FR20, FR50).
 * Orchestrates per-page: update desc store → for each asset →
 * lookup desc → filter → build item → apply strategy → apply field selection → accumulate.
 */
export class InMemoryInventoryRepository implements IInventoryRepository {
  private items: ItemDetails[] = [];
  private descStore = new DescriptionStore();

  addPage(page: InventoryPage, config: ParseConfig): void {
    // Update rolling description window
    this.descStore.addPage(page.descriptions);

    for (const asset of page.assets) {
      const instanceid = asset.instanceid || '0';
      const desc = this.descStore.get(asset.classid, instanceid);

      // Filter: currency, missing desc, tradableOnly
      if (!shouldInclude(asset, desc, { tradableOnly: config.tradableOnly })) {
        continue;
      }

      // Build flat item
      let item = buildItem(asset, desc!, config.contextId);

      // Apply strategy
      item = config.strategy.apply(item);

      // Apply field selection
      item = selectFields(item, config.fields);

      this.items.push(item);
    }
  }

  getItems(): ItemDetails[] {
    return this.items;
  }

  getItemCount(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
    this.descStore.clear();
  }
}
