import {
  LoaderResponse,
  OptionalConfig,
} from './dtos/steam-inventory-loader-dtos';

export abstract class ISteamInventoryLoader {
  abstract load(
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SteamID64: string,
    appID: string | number,
    contextID: string | number,
    optionalConfig?: OptionalConfig,
  ): Promise<LoaderResponse>;
} 