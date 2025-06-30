import { STEAM_CDN_IMAGE_URL } from '@domain/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';

export class SteamItemPresenter {
  constructor(private readonly item: SteamItemEntity) {}

  public getImageUrl(size?: 'normal' | 'large'): string {
    const isLarge = size === 'large';

    if (isLarge && this.item.icon_url_large) {
      return `${STEAM_CDN_IMAGE_URL}/${this.item.icon_url_large}`;
    }

    return `${STEAM_CDN_IMAGE_URL}/${this.item.icon_url}`;
  }
}
