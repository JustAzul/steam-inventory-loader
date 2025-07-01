import { STEAM_CONTEXT_IDS } from '@domain/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';

import { IAppSpecificLogic } from './IAppSpecificLogic';

export class SteamCommunityLogic implements IAppSpecificLogic {
  public getCacheExpiration(item: SteamItemEntity): string | undefined {
    if (
      item.adapter.contextid === STEAM_CONTEXT_IDS.COMMUNITY_ITEMS &&
      item.market_name !== null &&
      item.market_name !== undefined &&
      item.market_name.length > 0
    ) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 1);
      return expirationDate.toISOString();
    }
  }

  public getMarketFeeApp(item: SteamItemEntity): number | undefined {
    if (
      item.adapter.contextid === STEAM_CONTEXT_IDS.COMMUNITY_ITEMS &&
      item.market_name !== null &&
      item.market_name !== undefined &&
      item.market_name.length > 0
    ) {
      const match = item.market_name.match(/(\d+)/);
      if (match) {
        return Number(match[1]);
      }
    }
  }
}
