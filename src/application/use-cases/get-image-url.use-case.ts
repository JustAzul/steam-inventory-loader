import { InputWithIconURL } from '../../domain/types/input-with-icon-url.type';
/* eslint-disable camelcase */
import { STEAM_CDN_IMAGE_URL } from '../../shared/constants';

type GetImageUrlUseCaseProps = {
  input: InputWithIconURL;
  size?: 'normal' | 'large';
};

export default class GetImageUrlUseCase {
  public execute({
    input,
    size,
  }: GetImageUrlUseCaseProps): string {
    const isLarge = size === 'large';

    if (isLarge) {
      return `${STEAM_CDN_IMAGE_URL}/${
        input?.icon_url_large || input.icon_url
      }`;
    }

    return `${STEAM_CDN_IMAGE_URL}/${input.icon_url}`;
  }
}
