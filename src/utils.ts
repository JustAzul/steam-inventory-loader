import { CardType } from './types/card-type.type';
import { ItemDescription } from './types/item-description.type';
import { ItemDetails } from './types/item-details.type';
import { Tag } from './types/tag.type';

export default class Utils {
  public static getTag(tags: Tag[], category: string): Tag | null {
    if (!tags) return null;
    return tags.find((tag) => tag.category === category) || null;
  }

  public static getLargeImageURL({
    // eslint-disable-next-line camelcase
    icon_url_large,
    // eslint-disable-next-line camelcase
    icon_url,
  }: ItemDescription | ItemDetails): string {
    return `https://steamcommunity-a.akamaihd.net/economy/image/${
      // eslint-disable-next-line camelcase
      icon_url_large || icon_url
    }/`;
  }

  public static getImageURL({
    // eslint-disable-next-line camelcase
    icon_url,
  }: ItemDescription | ItemDetails): string {
    // eslint-disable-next-line camelcase
    return `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url}/`;
  }

  public static isCardType(tags: Tag[]): undefined | false | CardType {
    if (!tags) return false;

    try {
      if (this.getTag(tags, 'item_class')?.internal_name === 'item_class_2') {
        if (this.getTag(tags, 'cardholder')?.internal_name === 'cardborder_0')
          return 'Normal';
        if (this.getTag(tags, 'cardborder')?.internal_name === 'cardborder_1')
          return 'Foil';
      }
    } catch {
      return false;
    }

    return false;
  }
}
