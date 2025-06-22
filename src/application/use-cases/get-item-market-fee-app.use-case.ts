import { injectable } from 'tsyringe';
import SteamItemEntity from '@domain/entities/steam-item.entity';

@injectable()
export default class GetItemMarketFeeAppUseCase {
  public execute(item: SteamItemEntity): number | undefined {
    if (
      item.getAppId() === 753 &&
      item.contextid === '6' &&
      !!item.market_hash_name
    ) {
      const matchResult = /^(\d+)-/.exec(item.market_hash_name);
      if (matchResult) return parseInt(matchResult[1], 10);
    }
    return undefined;
  }
} 