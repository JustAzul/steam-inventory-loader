import { injectable } from 'tsyringe';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { STEAM_APP_IDS, STEAM_CONTEXT_IDS, STEAM_MARKET_PATTERNS } from '@shared/constants';

@injectable()
export default class GetItemMarketFeeAppUseCase {
  public execute(item: SteamItemEntity): number | undefined {
    if (
      item.getAppId() === STEAM_APP_IDS.STEAM_COMMUNITY &&
      item.contextid === STEAM_CONTEXT_IDS.COMMUNITY_ITEMS &&
      !!item.market_hash_name
    ) {
      const matchResult = STEAM_MARKET_PATTERNS.COMMUNITY_ITEM_PREFIX.exec(item.market_hash_name);
      if (matchResult && matchResult[1]) {
        return parseInt(matchResult[1], 10);
      }
    }
    return undefined;
  }
} 