import type { ItemAsset, ItemDescription } from '../types.js';

interface FilterConfig {
  tradableOnly: boolean;
}

/**
 * Determine if an asset should be included in the output.
 * Pure function — checks currency, description presence, tradability.
 */
export function shouldInclude(
  asset: ItemAsset,
  description: ItemDescription | undefined,
  config: FilterConfig,
): boolean {
  // FR19: Exclude currency items
  if (typeof asset.currencyid !== 'undefined') {
    return false;
  }

  // FR20: Exclude items without matching description
  if (!description) {
    return false;
  }

  // FR18: Exclude non-tradable when tradableOnly is enabled
  if (config.tradableOnly && !description.tradable) {
    return false;
  }

  return true;
}
