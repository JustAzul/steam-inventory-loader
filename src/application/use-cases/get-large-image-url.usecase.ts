import { ItemDescription } from '../../domain/types/item-description.type';
import { ItemDetails } from '../../domain/types/item-details.type';
import { STEAM_IMAGE_URL } from '../../domain/constants';

export default class GetImageUrlUseCase {
  public static execute(
    input: ItemDescription | ItemDetails,
    option?: { size: 'normal' | 'large' },
  ): string {
    if (option?.size === 'large') {
      return `${STEAM_IMAGE_URL}/${input?.icon_url_large || input.icon_url}`;
    }

    return `${STEAM_IMAGE_URL}/${input.icon_url}`;
  }
}
