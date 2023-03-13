import IAzulSteamInventoryLoader from '../application/ports/azul-steam-inventory-loader.interface';
import LoaderUtils from './loader-utils';
import { UnwrapPromise } from '../shared/types/unwrap-promise.type';

export default class AzulSteamInventoryLoader
  extends LoaderUtils
  implements IAzulSteamInventoryLoader
{
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
}
