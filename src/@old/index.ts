import AzulInventoryResponse from '../domain/entities/azul-inventory-response.entity';
import FindSteamTagUseCase from '../application/use-cases/find-steam-tag.usecase';
import { IAzulSteamInventoryLoader } from '../application/ports/azul-steam-inventory-loader.interface';
import { OptionalConfig } from '../domain/types/optional-config.type';
import { rawTag } from '../domain/types/raw-tag.type';

export default class AzulSteamInventoryLoader
  implements IAzulSteamInventoryLoader
{
  // public readonly InventoryLoader:IInventoryLoader;

  public static async Loader(
    SteamID64: string,
    appID: string | number,
    contextID: string | number,
    optionalConfig?: OptionalConfig,
  ): Promise<AzulInventoryResponse> {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      count: 0,
      inventory: [],
      success: true,
    };
  }

  public static getTag(tags: rawTag[], categoryToFind: string): rawTag | null {
    FindSteamTagUseCase.execute(tags, categoryToFind);
    return null;
  }
}
