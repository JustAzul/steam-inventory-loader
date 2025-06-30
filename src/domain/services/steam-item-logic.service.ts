import SteamItemEntity, {
  CardBorderInternalName,
} from '@domain/entities/steam-item.entity';
import { CardType } from '@domain/types/card-type.type';

export class SteamItemLogicService {
  public getCacheExpiration(item: SteamItemEntity): string | undefined {
    return item.getStrategy().getCacheExpiration(item);
  }

  public getMarketFeeApp(item: SteamItemEntity): number | undefined {
    return item.getStrategy().getMarketFeeApp(item);
  }

  getCardType(item: SteamItemEntity): CardType | undefined {
    if (!item.tags) {
      return undefined;
    }
    const isTradingCard = item.tags.some(
      (tag) =>
        tag.category === 'item_class' && tag.internal_name === 'item_class_6',
    );
    if (isTradingCard) {
      const cardBorder = item.tags.find((tag) => tag.category === 'cardborder');
      if (cardBorder) {
        if (cardBorder.internal_name === CardBorderInternalName.NORMAL) {
          return 'Normal';
        }
        if (cardBorder.internal_name === CardBorderInternalName.FOIL) {
          return 'Foil';
        }
      }
    }
    return undefined;
  }
}
