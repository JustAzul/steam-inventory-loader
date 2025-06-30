import { STEAM_CONTEXT_IDS, STEAM_MARKET_PATTERNS } from '@domain/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { InnerItemDescription } from '@domain/types/inner-item-description.type';

import { IAppSpecificLogic } from './IAppSpecificLogic';

export class CounterStrike2Logic implements IAppSpecificLogic {
  private findTradableDescription(
    item: SteamItemEntity,
  ): InnerItemDescription | undefined {
    if (
      item.contextid !== STEAM_CONTEXT_IDS.INVENTORY ||
      !item.owner_descriptions
    ) {
      return undefined;
    }
    return item.owner_descriptions.find(
      (description) =>
        description.value !== null &&
        description.value !== undefined &&
        STEAM_MARKET_PATTERNS.TRADABLE_AFTER.test(description.value),
    );
  }

  private parseTradableDate(
    tradableDescriptionValue: string,
  ): string | undefined {
    try {
      const dateString = tradableDescriptionValue
        .replace(STEAM_MARKET_PATTERNS.TRADABLE_AFTER, '')
        .replace(/[,()]/g, '');

      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    } catch {
      return undefined;
    }
  }

  public getCacheExpiration(item: SteamItemEntity): string | undefined {
    if (
      item.item_expiration !== null &&
      item.item_expiration !== undefined &&
      item.item_expiration !== ''
    ) {
      return item.item_expiration;
    }

    const tradableDescription = this.findTradableDescription(item);
    if (
      tradableDescription?.value !== null &&
      tradableDescription?.value !== undefined &&
      tradableDescription?.value !== ''
    ) {
      return this.parseTradableDate(tradableDescription.value);
    }

    return undefined;
  }

  public getMarketFeeApp(): number | undefined {
    return undefined;
  }

  public isFloat(item: SteamItemEntity): boolean {
    if (
      item.market_hash_name !== null &&
      item.market_hash_name !== undefined &&
      item.market_hash_name !== ''
    ) {
      return item.market_hash_name.includes('Float');
    }
    return false;
  }

  public isSticker(item: SteamItemEntity): boolean {
    const stickerTag = item.findTag('Type');
    if (stickerTag) {
      return stickerTag.internal_name === 'CSGO_Type_Sticker';
    }
    return false;
  }

  public isStatTrak(item: SteamItemEntity): boolean {
    if (
      item.market_hash_name !== null &&
      item.market_hash_name !== undefined &&
      item.market_hash_name !== ''
    ) {
      return item.market_hash_name.includes('StatTrak™');
    }
    return false;
  }
}
