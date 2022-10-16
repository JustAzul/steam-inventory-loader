import { CardType } from './types/card-type.type';
import { ItemDescription } from './types/item-description.type';
import { ItemDetails } from './types/item-details.type';
import { Tag } from './types/tag.type';

export default class Utils {
  public static getTag(tags: Tag[], categoryToFind: string): Tag | null {
    if (!tags) return null;
    return tags.find(({ category }) => category === categoryToFind) ?? null;
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

  public static isCardType(tags?: Tag[]): false | CardType {
    if (!tags) return false;

    const itemClass = Utils.getTag(tags, 'item_class');

    if (itemClass && itemClass.internal_name === 'item_class_2') {
      const cardBorder = Utils.getTag(tags, 'cardborder');

      if (cardBorder) {
        if (cardBorder.internal_name === 'cardborder_0') return 'Normal';
        if (cardBorder.internal_name === 'cardborder_1') return 'Foil';
      }
    }

    return false;
  }
}
