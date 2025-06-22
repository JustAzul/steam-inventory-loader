import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { DIContainer } from './di-container';
import { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
import { rawTag } from '@domain/types/raw-tag.type';
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { CardType } from '@domain/types/card-type.type';

export default class AzulSteamInventoryLoader
  implements IAzulSteamInventoryLoader
{
  private readonly diContainer: DIContainer;

  constructor(config: LoaderConfig) {
    this.diContainer = new DIContainer(config);
  }

  public load(
    steamID64: string,
    appID: string,
    contextID: string,
  ): Promise<SteamItemEntity[]> {
    const loadInventoryUseCase = this.diContainer.getLoadInventoryUseCase(
      steamID64,
      appID,
      contextID,
    );
    return loadInventoryUseCase.execute();
  }

  public getTag(
    tags: Array<rawTag | SteamItemTag>,
    categoryToFind: string,
  ): rawTag | SteamItemTag | null {
    const findTagUseCase = this.diContainer.getFindTagUseCase();
    return findTagUseCase.execute({ tags, categoryToFind });
  }

  public getImageUrl(
    input: InputWithIconURL,
    size?: 'normal' | 'large',
  ): string {
    const getImageUrlUseCase = this.diContainer.getGetImageUrlUseCase();
    return getImageUrlUseCase.execute({ input, size });
  }

  public isCardFoil(
    tags: Readonly<Pick<SteamItemTag, 'internal_name' | 'category'>>[],
  ): CardType | null {
    const findCardBorderTypeUseCase =
      this.diContainer.getFindCardBorderTypeUseCase();
    return findCardBorderTypeUseCase.execute({ tags });
  }
}
