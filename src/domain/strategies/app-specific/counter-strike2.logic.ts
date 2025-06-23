import {
  STEAM_CONTEXT_IDS,
  STEAM_MARKET_PATTERNS,
} from '@domain/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';

import { IAppSpecificLogic } from './IAppSpecificLogic';

export class CounterStrike2Logic implements IAppSpecificLogic {
  public getCacheExpiration(item: SteamItemEntity): string | undefined {
    if (item.item_expiration) return item.item_expiration;

    if (
      item.contextid === STEAM_CONTEXT_IDS.INVENTORY &&
      item.owner_descriptions
    ) {
      const tradableDescription = item.owner_descriptions.find(
        (description) =>
          description.value &&
          STEAM_MARKET_PATTERNS.TRADABLE_AFTER.test(description.value),
      );

      if (tradableDescription?.value) {
        try {
          const dateString = tradableDescription.value
            .replace(STEAM_MARKET_PATTERNS.TRADABLE_AFTER, '')
            .replace(/[,()]/g, '');

          const date = new Date(dateString);

          if (isNaN(date.getTime())) {
            return undefined;
          }

          return date.toISOString();
        } catch {
          return undefined;
        }
      }
    }

    return undefined;
  }

  public getMarketFeeApp(): number | undefined {
    return undefined;
  }
} 