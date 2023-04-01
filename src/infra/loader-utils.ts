import FindCardBorderTypeUseCase from '../application/use-cases/find-card-border-type.use-case';
import FindTagUseCase from '../application/use-cases/find-tag.use-case';
import GetImageUrlUseCase from '../application/use-cases/get-image-url.use-case';
import IAzulSteamInventoryLoader from '../application/ports/azul-steam-inventory-loader.interface';
import ILoaderUtils from '../application/ports/loader-utils.interface';

export default class LoaderUtils extends ILoaderUtils {
  public static getTags(
    tags: Parameters<(typeof IAzulSteamInventoryLoader)['getTag']>[0],
    categoryToFind: Parameters<(typeof IAzulSteamInventoryLoader)['getTag']>[1],
  ): ReturnType<(typeof IAzulSteamInventoryLoader)['getTag']> {
    const result = FindTagUseCase.execute({ tags, categoryToFind });
    return result as ReturnType<(typeof IAzulSteamInventoryLoader)['getTag']>;
  }

  public static getLargeImageURL(
    input: Parameters<
      (typeof IAzulSteamInventoryLoader)['getLargeImageURL']
    >[0],
  ): ReturnType<(typeof IAzulSteamInventoryLoader)['getLargeImageURL']> {
    const result: ReturnType<
      (typeof IAzulSteamInventoryLoader)['getLargeImageURL']
    > = GetImageUrlUseCase.execute({ input, size: 'large' });

    return result;
  }

  public static getImageURL(
    input: Parameters<(typeof IAzulSteamInventoryLoader)['getImageURL']>[0],
  ): ReturnType<(typeof IAzulSteamInventoryLoader)['getImageURL']> {
    const result: ReturnType<
      (typeof IAzulSteamInventoryLoader)['getImageURL']
    > = GetImageUrlUseCase.execute({
      input,
      size: 'normal',
    });

    return result;
  }

  public static isCardType(
    tags?: Parameters<(typeof IAzulSteamInventoryLoader)['isCardType']>[0],
  ): ReturnType<(typeof IAzulSteamInventoryLoader)['isCardType']> {
    if (!tags || !tags.length) return false;

    const result = new FindCardBorderTypeUseCase({ tags }).execute();

    if (result === null) return false;
    return result;
  }
}
