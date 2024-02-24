import { OptionalConfig } from '@domain/types/optional-config.type';
import { AzulInventoryResponse } from '../types/azul-inventory-response.type';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { IInventoryLoader } from './inventory-loader.interface';
import ILoaderUtils from './loader-utils.interface';

export default abstract class IAzulSteamInventoryLoader extends ILoaderUtils {
  static readonly InventoryLoader: IInventoryLoader;

  static Loader(
    SteamID64: string,
    appID: string | number,
    contextID: string | number,
    optionalConfig?: OptionalConfig,
  ): Promise<AzulInventoryResponse> {
    throw new Error('Not implemented');
  }
}
