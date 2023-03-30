import { InputWithIconURL } from '../../domain/types/input-with-icon-url.type';
/* eslint-disable camelcase */
import { STEAM_CDN_IMAGE_URL } from '../../shared/constants';

type GetImageUrlUseCaseProps = {
  input: InputWithIconURL;
  size?: 'normal' | 'large';
};

export default class GetImageUrlUseCase {
  public static execute(props: Readonly<GetImageUrlUseCaseProps>): string {
    const isLarge = props?.size === 'large';

    if (isLarge) {
      return `${STEAM_CDN_IMAGE_URL}/${
        props.input?.icon_url_large || props.input.icon_url
      }`;
    }

    return `${STEAM_CDN_IMAGE_URL}/${props.input.icon_url}`;
  }
}
