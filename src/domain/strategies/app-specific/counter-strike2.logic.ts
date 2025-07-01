import { STEAM_CONTEXT_IDS, STEAM_MARKET_PATTERNS } from '@domain/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { InnerItemDescription } from '@domain/types/inner-item-description.type';

import { IAppSpecificLogic } from './IAppSpecificLogic';

export class CounterStrike2Logic implements IAppSpecificLogic {
  private findTradableDescription(
    item: SteamItemEntity,
  ): InnerItemDescription | undefined {
    if (
      item.adapter.contextid !== STEAM_CONTEXT_IDS.INVENTORY ||
      !item.adapter.descriptions
    ) {
      return undefined;
    }
    return item.adapter.descriptions.find(
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

  public getStickerInfo(
    item: SteamItemEntity,
  ): InnerItemDescription | undefined {
    if (
      item.adapter.contextid !== STEAM_CONTEXT_IDS.INVENTORY ||
      !item.adapter.descriptions
    ) {
      return undefined;
    }
    return item.adapter.descriptions.find(
      (description) =>
        description.value !== null &&
        description.value !== undefined &&
        typeof description.value === 'string' &&
        description.value.includes('sticker_info'),
    );
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

  public isTradable(item: SteamItemEntity): boolean {
    if (
      item.adapter.contextid !== STEAM_CONTEXT_IDS.INVENTORY ||
      item.adapter.tradable === false
    ) {
      return false;
    }
    return true;
  }

  public hasSpecialAttributes(item: SteamItemEntity): boolean {
    if (
      item.adapter.market_hash_name !== null &&
      item.adapter.market_hash_name !== undefined &&
      item.adapter.market_hash_name !== ''
    ) {
      return item.adapter.market_hash_name.includes('Float');
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
      item.adapter.market_hash_name !== null &&
      item.adapter.market_hash_name !== undefined &&
      item.adapter.market_hash_name !== ''
    ) {
      return item.adapter.market_hash_name.includes('StatTrak™');
    }
    return false;
  }

  public isFloat(item: SteamItemEntity): boolean {
    if (
      item.adapter.market_hash_name !== null &&
      item.adapter.market_hash_name !== undefined &&
      item.adapter.market_hash_name !== ''
    ) {
      return item.adapter.market_hash_name.includes('Float');
    }
    return false;
  }

  public getStickerName(item: SteamItemEntity): string | undefined {
    if (
      !item.adapter.descriptions ||
      item.adapter.descriptions.length === 0
    ) {
      return;
    }
    const description = item.adapter.descriptions.find(
      (d) => d.value.includes('sticker_info'),
    );
    if (description) {
      const stickerName = description.value.match(/<br>Sticker: (.*?)<\/center>/);
      if (stickerName && stickerName[1]) {
        return stickerName[1];
      }
    }
    return undefined;
  }
}
