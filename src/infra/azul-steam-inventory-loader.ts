import FindCardBorderTypeUseCase from '../application/use-cases/find-card-border-type.usecase';
import FindTagUseCase from '../application/use-cases/find-tag.usecase';
import GetImageUrlUseCase from '../application/use-cases/get-image-url.usecase';
import IAzulSteamInventoryLoader from '../application/ports/azul-steam-inventory-loader.interface';
import { UnwrapPromise } from '../shared/types/unwrap-promise.type';

export default class AzulSteamInventoryLoader extends IAzulSteamInventoryLoader {
  // public readonly InventoryLoader:IInventoryLoader;

  public static async Loader(
    SteamID64: Parameters<typeof IAzulSteamInventoryLoader['Loader']>[0],
    appID: Parameters<typeof IAzulSteamInventoryLoader['Loader']>[1],
    contextID: Parameters<typeof IAzulSteamInventoryLoader['Loader']>[2],
    optionalConfig?: Parameters<typeof IAzulSteamInventoryLoader['Loader']>[3],
  ): ReturnType<typeof IAzulSteamInventoryLoader['Loader']> {
    throw new Error('Not implemented yet');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result: UnwrapPromise<
      ReturnType<typeof IAzulSteamInventoryLoader['Loader']>
    > = {
      count: 0,
      inventory: [],
      success: true,
    };

    return result;
  }

  public static getTag(
    tags: Parameters<typeof IAzulSteamInventoryLoader['getTag']>[0],
    categoryToFind: Parameters<typeof IAzulSteamInventoryLoader['getTag']>[1],
  ): ReturnType<typeof IAzulSteamInventoryLoader['getTag']> {
    const result: ReturnType<typeof IAzulSteamInventoryLoader['getTag']> =
      FindTagUseCase.execute(tags, categoryToFind);

    return result;
  }

  public static getLargeImageURL(
    input: Parameters<typeof IAzulSteamInventoryLoader['getLargeImageURL']>[0],
  ): ReturnType<typeof IAzulSteamInventoryLoader['getLargeImageURL']> {
    const result: ReturnType<
      typeof IAzulSteamInventoryLoader['getLargeImageURL']
    > = GetImageUrlUseCase.execute(input, {
      size: 'large',
    });

    return result;
  }

  public static getImageURL(
    input: Parameters<typeof IAzulSteamInventoryLoader['getImageURL']>[0],
  ): ReturnType<typeof IAzulSteamInventoryLoader['getImageURL']> {
    const result: ReturnType<typeof IAzulSteamInventoryLoader['getImageURL']> =
      GetImageUrlUseCase.execute(input, {
        size: 'normal',
      });

    return result;
  }

  public static isCardType(
    tags?: Parameters<typeof IAzulSteamInventoryLoader['isCardType']>[0],
  ): ReturnType<typeof IAzulSteamInventoryLoader['isCardType']> {
    if (!tags || !tags.length) return false;

    const result = FindCardBorderTypeUseCase.execute(tags);

    if (result === null) return false;
    return result;
  }
}
