import type { IStrategy, ItemDetails } from '../types.js';

const TRADABLE_AFTER_PATTERN = /Tradable After (.+?) \((\d{2}:\d{2}:\d{2})\) GMT/;

/**
 * CS2 strategy (app 730, ctx 2): extracts tradable dates from owner_descriptions.
 */
export class CS2Strategy implements IStrategy {
  apply(item: ItemDetails): ItemDetails {
    if (!item.owner_descriptions) return item;

    for (const desc of item.owner_descriptions) {
      if (!desc.value) continue;
      const match = desc.value.match(TRADABLE_AFTER_PATTERN);
      if (match) {
        const dateStr = `${match[1]} ${match[2]} GMT`;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return { ...item, cache_expiration: date.toISOString() };
        }
      }
    }

    return item;
  }
}
