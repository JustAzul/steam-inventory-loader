/* eslint-disable no-shadow */
/* eslint-disable max-len */
import RawLoader, {
  getTag, getImageURL, getLargeImageURL, AzulInventoryResponse, isCardType,
} from './getInventory';
import { CleanCache } from './Database';

export interface Config {
    Cache?: boolean,
    Duration?: number,
    // eslint-disable-next-line camelcase, @typescript-eslint/no-explicit-any
    SteamCommunity_Jar?: any,
    tradableOnly?: boolean,
    enableGC?: boolean
}

const Loader = (SteamID64: string, appID: string | number, contextID: string | number, Config: Config): Promise<AzulInventoryResponse> => {
  const Defaults = {
    Cache: Config?.Cache || false,
    Duration: Config?.Duration || 15,
    SteamCommunity_Jar: Config?.SteamCommunity_Jar || undefined,
    tradableOnly: Config?.tradableOnly || true,
    enableGC: Config?.enableGC || false,
  };

  return RawLoader(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Cache, Defaults.Duration, Defaults.enableGC);
};

export default {
  Loader, getTag, getImageURL, getLargeImageURL, CleanCache, isCardType,
};
