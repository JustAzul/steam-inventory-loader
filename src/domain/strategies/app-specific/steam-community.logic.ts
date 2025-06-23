import {
  STEAM_CONTEXT_IDS,
  STEAM_MARKET_PATTERNS,
} from '@domain/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';

import { IAppSpecificLogic } from './IAppSpecificLogic';

export class SteamCommunityLogic implements IAppSpecificLogic {
  public getCacheExpiration(item: SteamItemEntity): string | undefined {
    return item.item_expiration;
  }

  public getMarketFeeApp(item: SteamItemEntity): number | undefined {
    if (
      item.contextid === STEAM_CONTEXT_IDS.COMMUNITY_ITEMS &&
      !!item.market_hash_name
    ) {
      const matchResult = STEAM_MARKET_PATTERNS.COMMUNITY_ITEM_PREFIX.exec(
        item.market_hash_name,
      );
      if (matchResult && matchResult[1]) {
        return parseInt(matchResult[1], 10);
      }
    }
    return undefined;
  }
} 