import { DEFAULT_STEAM_IMAGE_URL } from './constants';

import type { CardType } from '../domain/types/card-type.type';
import type { InventoryPageDescription } from '../domain/types/inventory-page-description.type';
import type { ItemDetails } from '../domain/types/item-details.type';
import type { rawTag } from '../domain/types/raw-tag.type';

export default class Utils {
  public static getTag(tags: rawTag[], categoryToFind: string): rawTag | null {
    if (!tags) return null;
    return tags.find(({ category }) => category === categoryToFind) ?? null;
  }

  public static getLargeImageURL({
    // eslint-disable-next-line camelcase
    icon_url_large,
    // eslint-disable-next-line camelcase
    icon_url,
  }: InventoryPageDescription | ItemDetails): string {
    return `${DEFAULT_STEAM_IMAGE_URL}/${
      // eslint-disable-next-line camelcase
      icon_url_large || icon_url
    }`;
  }

  public static getImageURL({
    // eslint-disable-next-line camelcase
    icon_url,
  }: InventoryPageDescription | ItemDetails): string {
    // eslint-disable-next-line camelcase
    return `${DEFAULT_STEAM_IMAGE_URL}/${icon_url}`;
  }

  public static isCardType(tags?: rawTag[]): false | CardType {
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
