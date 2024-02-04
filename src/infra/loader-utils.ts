import IAzulSteamInventoryLoader from '../application/ports/azul-steam-inventory-loader.interface';
import ILoaderUtils from '../application/ports/loader-utils.interface';
import FindCardBorderTypeUseCase from '../application/use-cases/find-card-border-type.use-case';
import FindTagUseCase from '../application/use-cases/find-tag.use-case';
import GetImageUrlUseCase from '../application/use-cases/get-image-url.use-case';

type AzulSteamInventoryLoader = typeof IAzulSteamInventoryLoader;

export default class LoaderUtils implements ILoaderUtils {
  public static getTags(
    tags: Parameters<AzulSteamInventoryLoader['getTag']>[0],
    categoryToFind: Parameters<AzulSteamInventoryLoader['getTag']>[1],
  ): ReturnType<AzulSteamInventoryLoader['getTag']> {
    const result = new FindTagUseCase({ categoryToFind, tags }).execute();
    return result as ReturnType<AzulSteamInventoryLoader['getTag']>;
  }

  public static getLargeImageURL(
    input: Parameters<AzulSteamInventoryLoader['getLargeImageURL']>[0],
  ): ReturnType<AzulSteamInventoryLoader['getLargeImageURL']> {
    const result: ReturnType<AzulSteamInventoryLoader['getLargeImageURL']> =
      new GetImageUrlUseCase({ input, size: 'large' }).execute();

    return result;
  }

  public static getImageURL(
    input: Parameters<AzulSteamInventoryLoader['getImageURL']>[0],
  ): ReturnType<AzulSteamInventoryLoader['getImageURL']> {
    const result: ReturnType<AzulSteamInventoryLoader['getImageURL']> =
      new GetImageUrlUseCase({
        input,
        size: 'normal',
      }).execute();

    return result;
  }

  public static isCardType(
    tags?: Parameters<AzulSteamInventoryLoader['isCardType']>[0],
  ): ReturnType<AzulSteamInventoryLoader['isCardType']> {
    if (!tags || !tags.length) return false;

    const result = new FindCardBorderTypeUseCase({ tags }).execute();
    const hasFoundResult = result !== null;

    if (hasFoundResult) {
      return result;
    }

    return false;
  }
}
