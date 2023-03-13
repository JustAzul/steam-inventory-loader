/* eslint-disable @typescript-eslint/no-unused-vars */
import AzulInventoryResponse from '../../domain/entities/azul-inventory-response.entity';
import { IInventoryLoader } from './inventory-loader.interface';
import ILoaderUtils from './loader-utils.interface';
import { OptionalConfig } from '../../domain/types/optional-config.type';

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
