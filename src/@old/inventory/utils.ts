import type { InventoryPageAsset } from '../../domain/types/inventory-page-asset.type';
import type { InventoryPageDescription } from '../../domain/types/inventory-page-description.type';
import type { ItemDetails } from '../../domain/types/item-details.type';
import type { rawTag } from '../../domain/types/raw-tag.type';
import type { SteamTag } from '../../domain/types/steam-tag.type';

export default class InventoryUtils {
  public static findDescriptionKey({
    appid,
    classid,
    instanceid,
  }: InventoryPageDescription | InventoryPageAsset): string {
    return `${classid}_${instanceid || '0'}_${appid}`;
  }

  private static parseTag(tag: SteamTag): rawTag {
    return {
      category: tag?.category,
      category_name: tag?.localized_category_name || tag.category_name,
      color: tag.color || '',
      internal_name: tag.internal_name,
      name: tag?.localized_tag_name || tag.name || '',
    };
  }

  private static parseTags(tags: SteamTag[]): rawTag[] {
    const ParsedTags: rawTag[] = [];

    for (let i = 0; i < tags.length; i += 1) {
      const tag = tags[i];
      ParsedTags.push(InventoryUtils.parseTag(tag));
    }

    return ParsedTags;
  }

  public static parseItem({
    contextID,
    description,
    item,
  }: {
    contextID: string;
    description: InventoryPageDescription;
    item: InventoryPageAsset;
  }): ItemDetails {
    // eslint-disable-next-line camelcase
    const is_currency =
      !!(item.is_currency || item.currency) ||
      typeof item.currencyid !== 'undefined';
    // eslint-disable-next-line camelcase
    const id =
      // eslint-disable-next-line camelcase
      is_currency && !!item?.currencyid ? item.currencyid : item.assetid;

    if (description) {
      // Is this a listing of descriptions?
      const ListingKey = `${item.classid}_${item.instanceid}`;
      if (Object.prototype.hasOwnProperty.call(description, ListingKey))
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore need some rework on this later
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-param-reassign
        description = description[ListingKey];
    }

    const itemDetails: ItemDetails = {
      actions: description?.actions || [],
      amount: parseInt(item.amount, 10),
      appid: item.appid,
      assetid: item.assetid,
      background_color: description.background_color,
      classid: item.classid,
      commodity: !!description?.commodity,
      contextid: item.contextid || contextID,

      currency: description.currency,
      descriptions: description?.descriptions || [],
      fraudwarnings: description?.fraudwarnings || [],

      icon_url: description.icon_url,
      icon_url_large: description.icon_url_large,

      id,
      instanceid: item.instanceid || '0',

      is_currency,
      item_expiration: description?.item_expiration || undefined,
      market_hash_name: description?.market_hash_name,

      market_marketable_restriction: description?.market_marketable_restriction
        ? parseInt(description.market_marketable_restriction.toString(), 10)
        : 0,
      market_name: description.market_name,
      market_tradable_restriction: description?.market_tradable_restriction
        ? parseInt(description.market_tradable_restriction.toString(), 10)
        : 0,
      marketable: !!description?.marketable,
      name: description.name,

      // eslint-disable-next-line eqeqeq
      owner:
        // eslint-disable-next-line eqeqeq
        description.owner && JSON.stringify(description.owner) == '{}'
          ? undefined
          : description.owner,
      owner_descriptions: description?.owner_descriptions || undefined,
      tradable: !!description?.tradable,
      type: description.type,
    };

    if (description?.tags) {
      itemDetails.tags = InventoryUtils.parseTags(description.tags);
    }

    // Restore market_fee_app, if applicable
    // eslint-disable-next-line eqeqeq
    if (
      // eslint-disable-next-line eqeqeq
      itemDetails.appid == 753 &&
      // eslint-disable-next-line eqeqeq
      itemDetails.contextid == '6' &&
      itemDetails.market_hash_name
    ) {
      // eslint-disable-next-line no-underscore-dangle
      const matchResult = /^(\d+)-/.exec(itemDetails.market_hash_name);
      if (matchResult)
        itemDetails.market_fee_app = parseInt(matchResult[1], 10);
    }

    // If we have item_expiration, also set cache_expiration to the same value
    if (itemDetails.item_expiration)
      itemDetails.cache_expiration = itemDetails.item_expiration;
    // eslint-disable-next-line eqeqeq
    else if (
      // eslint-disable-next-line eqeqeq
      itemDetails.appid == 730 &&
      // eslint-disable-next-line eqeqeq
      itemDetails.contextid == '2' &&
      itemDetails.owner_descriptions
    ) {
      const Desc = itemDetails.owner_descriptions.find(
        (d) => d.value && d.value.indexOf('Tradable After ') === 0,
      );
      if (Desc) {
        const date = new Date(Desc.value.substring(15).replace(/[,()]/g, ''));
        if (date) itemDetails.cache_expiration = date.toISOString();
      }
    }

    // eslint-disable-next-line no-param-reassign
    if (item.currency) item.currency = null;

    return itemDetails;
  }
}
