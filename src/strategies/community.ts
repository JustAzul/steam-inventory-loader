import type { IStrategy, ItemDetails } from '../types.js';

const MARKET_FEE_APP_PATTERN = /^(\d+)-/;

/**
 * Steam Community strategy (app 753, ctx 6): extracts market_fee_app from market_hash_name.
 */
export class CommunityStrategy implements IStrategy {
  apply(item: ItemDetails): ItemDetails {
    const match = item.market_hash_name.match(MARKET_FEE_APP_PATTERN);
    if (match) {
      return { ...item, market_fee_app: parseInt(match[1], 10) };
    }
    return { ...item, market_fee_app: undefined };
  }
}
