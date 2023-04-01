import { InputWithIconURL } from '../../domain/types/input-with-icon-url.type';
/* eslint-disable camelcase */
import { STEAM_CDN_IMAGE_URL } from '../../shared/constants';

type GetImageUrlUseCaseProps = {
  input: InputWithIconURL;
  size?: 'normal' | 'large';
};

export default class GetImageUrlUseCase {
  private readonly props: GetImageUrlUseCaseProps;

  public constructor(props: Readonly<GetImageUrlUseCaseProps>) {
    this.props = props;
  }

  public execute(): string {
    const isLarge = this.props?.size === 'large';

    if (isLarge) {
      return `${STEAM_CDN_IMAGE_URL}/${
        this.props.input?.icon_url_large || this.props.input.icon_url
      }`;
    }

    return `${STEAM_CDN_IMAGE_URL}/${this.props.input.icon_url}`;
  }
}
