import RawLoader, {
  getTag, getImageURL, getLargeImageURL, AzulInventoryResponse, isCardType,
} from './getInventory';

export interface Config {
    // eslint-disable-next-line camelcase, @typescript-eslint/no-explicit-any
    SteamCommunity_Jar?: any,
    tradableOnly?: boolean,
    Language?: string
}

const Loader = (SteamID64: string, appID: string | number, contextID: string | number, LoaderConfig: Config): Promise<AzulInventoryResponse> => {
  const Defaults = {
    SteamCommunity_Jar: LoaderConfig?.SteamCommunity_Jar || undefined,
    tradableOnly: LoaderConfig?.tradableOnly ?? true,
    Language: LoaderConfig?.Language ?? 'english',
  };

  return RawLoader(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Language);
};

export default {
  Loader, getTag, getImageURL, getLargeImageURL, isCardType,
};
