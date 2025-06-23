import { STEAM_CDN_IMAGE_URL } from '@domain/constants';
import { injectable } from 'tsyringe';

import { InputWithIconURL } from '../../domain/types/input-with-icon-url.type';

type GetImageUrlUseCaseProps = {
  input: InputWithIconURL;
  size?: 'normal' | 'large';
};

@injectable()
export default class GetImageUrlUseCase {
  public execute({ input, size }: GetImageUrlUseCaseProps): string {
    const isLarge = size === 'large';

    if (isLarge) {
      return `${STEAM_CDN_IMAGE_URL}/${
        input?.icon_url_large || input.icon_url
      }`;
    }

    return `${STEAM_CDN_IMAGE_URL}/${input.icon_url}`;
  }
}
