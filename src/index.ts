import type { AzulInventoryResponse } from './loader/types/azul-inventory-response.type';
import InventoryLoader from './loader';
import type { InventoryLoaderConstructor } from './loader/types/inventory-loader-constructor.type';
import type { OptionalConfig } from './types/optional-config.type';
import Utils from './utils';

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

        if (key === 'Language') setup.language = optionalConfig[key];
        if (key === 'maxRetries') setup.maxRetries = optionalConfig[key];
        if (key === 'proxyAddress') setup.proxyAddress = optionalConfig[key];
        if (key === 'SteamCommunity_Jar')
          setup.steamCommunityJar = optionalConfig[key];
        if (key === 'tradableOnly') setup.tradableOnly = optionalConfig[key];
        if (key === 'useProxy') setup.useProxy = optionalConfig[key];
      }
    }

    const loaderInterface = new InventoryLoader(setup);
    return loaderInterface.loadInventory();
  }
}
