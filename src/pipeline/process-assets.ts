import type { ItemAsset, ItemDescription, ItemDetails, IStrategy, Fields } from '../types.js';
import { DescriptionStore } from '../repository/description-store.js';
import { buildItem } from './item-builder.js';
import { shouldInclude } from './filter.js';
import { selectFields } from './field-selector.js';

export interface ProcessAssetsConfig {
  tradableOnly: boolean;
  fields?: readonly Fields[];
  strategy: IStrategy;
  contextId: number;
}

/**
 * Shared per-page asset pipeline: lookup desc → filter → build → strategy → field-select.
 * Used by both InMemoryInventoryRepository (main thread) and processPage (worker thread).
 */
export function processAssets(
  assets: ItemAsset[],
  descStore: DescriptionStore,
  config: ProcessAssetsConfig,
): ItemDetails[] {
  const items: ItemDetails[] = [];

  for (const asset of assets) {
    const instanceid = asset.instanceid || '0';
    const desc = descStore.get(asset.classid, instanceid);

    if (!shouldInclude(asset, desc, { tradableOnly: config.tradableOnly })) {
      continue;
    }

    let item = buildItem(asset, desc!, config.contextId);
    item = config.strategy.apply(item);
    item = config.fields ? selectFields(item, config.fields) as ItemDetails : selectFields(item);
    items.push(item);
  }

  return items;
}
