import type { IInventoryRepository, InventoryPage, ItemDetails, ParseConfig } from '../types.js';
import { DescriptionStore } from './description-store.js';
import { processAssets } from '../pipeline/process-assets.js';

/**
 * In-memory inventory repository (FR07, FR18-FR20, FR50).
 * Orchestrates per-page: update desc store → process assets through shared pipeline.
 */
export class InMemoryInventoryRepository implements IInventoryRepository {
  private items: ItemDetails[] = [];
  private descStore = new DescriptionStore();

  addPage(page: InventoryPage, config: ParseConfig): void {
    // Update rolling description window
    this.descStore.addPage(page.descriptions);

    const pageItems = processAssets(page.assets, this.descStore, {
      tradableOnly: config.tradableOnly,
      fields: config.fields,
      strategy: config.strategy,
      contextId: config.contextId,
    });

    this.items.push(...pageItems);
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
