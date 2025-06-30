import SteamItemEntity from '@domain/entities/steam-item.entity';

import { IAppSpecificLogic } from './IAppSpecificLogic';

export class DefaultLogic implements IAppSpecificLogic {
  public getCacheExpiration(item: SteamItemEntity): string | undefined {
    return item.item_expiration;
  }

  public getMarketFeeApp(): number | undefined {
    return undefined;
  }
}
