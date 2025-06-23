import SteamItemEntity from '@domain/entities/steam-item.entity';

export interface IAppSpecificLogic {
  getCacheExpiration(item: SteamItemEntity): string | undefined;
  getMarketFeeApp(item: SteamItemEntity): number | undefined;
} 