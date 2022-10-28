import InventoryLoader from './loader';
import type { InventoryLoaderConstructor } from './loader/types/inventory-loader-constructor.type';
import type { LoaderResponse } from './loader/types/loader-response';
import type { OptionalConfig } from './types/optional-config.type';
import Utils from './utils';

type AzulInventoryResponse = LoaderResponse;

const LoaderDictionary: Map<
  keyof OptionalConfig,
  keyof InventoryLoaderConstructor
> = new Map([
  ['Language', 'language'],
  ['SteamCommunity_Jar', 'steamCommunityJar'],
]);
export default class AzulSteamInventoryLoader extends Utils {
  public static Loader(
    SteamID64: string,
    appID: string | number,
    contextID: string | number,
    optionalConfig?: OptionalConfig,
  ): Promise<AzulInventoryResponse> {
    const setup: InventoryLoaderConstructor = {
      appID,
      contextID,
      steamID64: SteamID64,
    };

    if (optionalConfig) {
      const keys = Object.keys(optionalConfig) as Array<keyof OptionalConfig>;

      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];

        const setupKey =
          LoaderDictionary.get(key) ||
          (key as keyof InventoryLoaderConstructor);

        const setupValue = optionalConfig[key];

        if (setupValue) {
          (setup[setupKey] as typeof setupValue) = setupValue;
        }
      }
    }

    const loaderInterface = new InventoryLoader(setup);
    return loaderInterface.loadInventory();
  }
}
