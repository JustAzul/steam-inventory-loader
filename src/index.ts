/* eslint-disable @typescript-eslint/unbound-method */
import { AzulInventoryResponse } from './types/azul-inventory-response.type';
import InventoryLoader from './inventory-loader';
import { InventoryLoaderConstructor } from './types/inventory-loader-constructor.type';
import { OptionalConfig } from './types/optional-config.type';
import utils from './utils';

class AzulSteamInventoryLoader {
  public static async loader(
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

export default {
  getImageURL: utils.getImageURL,
  getLargeImageURL: utils.getLargeImageURL,
  getTag: utils.getTag,
  isCardType: utils.isCardType,
  Loader: AzulSteamInventoryLoader.loader,
};
