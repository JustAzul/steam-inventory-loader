import type { IStrategy, ItemDetails } from '../types.js';

/**
 * Default strategy: sets cache_expiration from item_expiration when present.
 */
export class DefaultStrategy implements IStrategy {
  apply(item: ItemDetails): ItemDetails {
    if (item.item_expiration) {
      return { ...item, cache_expiration: item.item_expiration };
    }
    return item;
  }
}
