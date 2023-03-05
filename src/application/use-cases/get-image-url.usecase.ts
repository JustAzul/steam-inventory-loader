import { InputWithIconURL } from '../../domain/types/input-with-icon-url.type';
/* eslint-disable camelcase */
import { STEAM_CDN_IMAGE_URL } from '../../shared/constants';

type GetImageUrlUseCaseOptions = {
  size: 'normal' | 'large';
};

export default class GetImageUrlUseCase {
  public static execute(
    input: InputWithIconURL,
    option?: GetImageUrlUseCaseOptions,
  ): string {
    if (option?.size === 'large') {
      return `${STEAM_CDN_IMAGE_URL}/${input?.icon_url_large || input.icon_url}`;
    }

    return `${STEAM_CDN_IMAGE_URL}/${input.icon_url}`;
  }
}
