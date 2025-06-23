import SteamItemEntity from '@domain/entities/steam-item.entity';
import {
  STEAM_APP_IDS,
  STEAM_CONTEXT_IDS,
  STEAM_MARKET_PATTERNS,
} from '@domain/constants';
import { injectable } from 'tsyringe';

@injectable()
export default class GetItemCacheExpirationUseCase {
  public execute(item: SteamItemEntity): string | undefined {
    if (item.item_expiration) return item.item_expiration;

    if (
      item.getAppId() === STEAM_APP_IDS.COUNTER_STRIKE_2 &&
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
            .substring(15) // Remove "Tradable After " prefix
            .replace(/[,()]/g, ''); // Remove commas and parentheses

          const date = new Date(dateString);

          // Validate the date
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
}
