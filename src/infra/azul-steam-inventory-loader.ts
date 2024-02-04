import IAzulSteamInventoryLoader from '../application/ports/azul-steam-inventory-loader.interface';
import { UnwrapPromise } from '../shared/types/unwrap-promise.type';

import LoaderUtils from './loader-utils';
import InventoryLoader, {
  InventoryLoaderConstructor,
} from './steam-community-inventory-loader';

export default class AzulSteamInventoryLoader
  extends LoaderUtils
  implements IAzulSteamInventoryLoader
{
  // public static readonly InventoryLoader: InventoryLoader;

  public static async Loader(
    SteamID64: Parameters<(typeof IAzulSteamInventoryLoader)['Loader']>[0],
    appID: Parameters<(typeof IAzulSteamInventoryLoader)['Loader']>[1],
    contextID: Parameters<(typeof IAzulSteamInventoryLoader)['Loader']>[2],
    optionalConfig?: Parameters<
      (typeof IAzulSteamInventoryLoader)['Loader']
    >[3],
  ): ReturnType<(typeof IAzulSteamInventoryLoader)['Loader']> {
    const config: InventoryLoaderConstructor = {
      appID,
      contextID,
      steamID64: SteamID64,
    };

    // TODO: setup optionalConfig

    // const loader = new InventoryLoader(config);

    const result: UnwrapPromise<
      ReturnType<(typeof IAzulSteamInventoryLoader)['Loader']>
    > = {};

    return result;
  }
}
