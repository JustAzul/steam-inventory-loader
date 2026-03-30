/**
 * Worker thread entry point (FR58).
 * Piscina loads this file in a separate V8 isolate.
 * Runs the full per-page pipeline via the shared processAssets function.
 */
import { DescriptionStore } from '../repository/description-store.js';
import { processAssets } from '../pipeline/process-assets.js';
import { StrategyRegistry } from '../strategies/registry.js';
import type { ItemAsset, ItemDescription, ItemDetails, Fields } from '../types.js';

const registry = new StrategyRegistry();

export interface ProcessPageData {
  assets: ItemAsset[];
  descriptions: ItemDescription[];
  previousDescriptions: ItemDescription[];
  config: {
    tradableOnly: boolean;
    fields?: readonly Fields[];
    contextId: number;
    appId: number;
    skipStrategy?: boolean;
  };
}

/**
 * Process a single inventory page through the full pipeline.
 * Called by Piscina via `pool.run(data, { name: 'processPage' })`.
 */
export function processPage(data: ProcessPageData): ItemDetails[] {
  const descStore = new DescriptionStore();

  // Reconstruct rolling window: previous page first, then current
  if (data.previousDescriptions.length > 0) {
    descStore.addPage(data.previousDescriptions);
  }
  descStore.addPage(data.descriptions);

  const strategy = registry.get(data.config.appId, data.config.contextId);

  return processAssets(data.assets, descStore, {
    tradableOnly: data.config.tradableOnly,
    fields: data.config.fields,
    strategy,
    contextId: data.config.contextId,
    skipStrategy: data.config.skipStrategy,
  });
}
