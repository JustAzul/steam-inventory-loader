import type { Cookie } from '../types/cookie.type';
import { HttpsAgent } from 'agentkeepalive';
import { HttpsProxyAgent } from 'hpagent';
import type { InventoryLoaderConstructor } from './types/inventory-loader-constructor.type';
import type { ItemAsset } from './types/item-asset.type';
import type { ItemDescription } from './types/item-description.type';
import type { ItemDetails } from './types/item-details.type';
import type { SteamTag } from './types/steam-tag.type';
import type { Tag } from './types/tag.type';

export default class LoaderUtils {
  private static readonly defaultAgent = new HttpsAgent();

  public static getAgent(proxyAddress?: string): HttpsProxyAgent | HttpsAgent {
    if (proxyAddress) {
      const ProxyAgent = new HttpsProxyAgent({
        keepAlive: true,
        proxy: proxyAddress,
      });

      return ProxyAgent;
    }

    return LoaderUtils.defaultAgent;
  }

  public static parseCookies(
    jarLikeInput?: InventoryLoaderConstructor['steamCommunityJar'],
  ): string {
    if (!jarLikeInput) return '';

    if ('_jar' in jarLikeInput) {
      // eslint-disable-next-line no-underscore-dangle
      return LoaderUtils.parseCookies(jarLikeInput._jar);
    }

    const result = (jarLikeInput.serializeSync().cookies as Cookie[])
      .filter(({ domain }) => domain === 'steamcommunity.com')
      .map(({ key, value }) => `${key}=${value};`)
      .join(' ');

    return result;
  }

  public static findDescriptionKey({
    appid,
    classid,
    instanceid,
  }: ItemDescription | ItemAsset): string {
    return `${classid}_${instanceid || '0'}_${appid}`;
  }

  private static parseTag(tag: SteamTag): Tag {
    return {
      internal_name: tag.internal_name,
      name: tag?.localized_tag_name || tag.name || '',
      category: tag?.category,
      color: tag.color || '',
      category_name: tag?.localized_category_name || tag.category_name,
    };
  }

  public static parseTags(tags: SteamTag[]): Tag[] {
    const ParsedTags: Tag[] = [];

    for (let i = 0; i < tags.length; i += 1) {
      const tag = tags[i];
      ParsedTags.push(LoaderUtils.parseTag(tag));
    }

    return ParsedTags;
  }

  public static parseItem({
    contextID,
    description,
    item,
  }: {
    contextID: string;
    description: ItemDescription;
    item: ItemAsset;
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
      is_currency,
      id,
      appid: item.appid,
      classid: item.classid,
      assetid: item.assetid,
      instanceid: item.instanceid || '0',
      amount: parseInt(item.amount, 10),
      contextid: item.contextid || contextID,

      tradable: !!description?.tradable,
      marketable: !!description?.marketable,
      commodity: !!description?.commodity,

      owner_descriptions: description?.owner_descriptions || undefined,
      item_expiration: description?.item_expiration || undefined,

      fraudwarnings: description?.fraudwarnings || [],
      descriptions: description?.descriptions || [],

      market_tradable_restriction: description?.market_tradable_restriction
        ? parseInt(description.market_tradable_restriction.toString(), 10)
        : 0,
      market_marketable_restriction: description?.market_marketable_restriction
        ? parseInt(description.market_marketable_restriction.toString(), 10)
        : 0,
      market_hash_name: description?.market_hash_name,

      actions: description?.actions || [],
      background_color: description.background_color,
      currency: description.currency,
      icon_url: description.icon_url,
      icon_url_large: description.icon_url_large,
      market_name: description.market_name,
      name: description.name,
      type: description.type,

      // eslint-disable-next-line eqeqeq
      owner:
        // eslint-disable-next-line eqeqeq
        description.owner && JSON.stringify(description.owner) == '{}'
          ? undefined
          : description.owner,
    };

    if (description?.tags) {
      itemDetails.tags = LoaderUtils.parseTags(description.tags);
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
