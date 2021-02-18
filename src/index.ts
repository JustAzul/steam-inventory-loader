import WorkerLoader from './Worker/getInventory';
import RawLoader, {getTag, getImageURL, getLargeImageURL, AzulInventoryResponse, isCardType} from './getInventory';
import {CleanCache} from './Database';

export interface Config {
    Cache?: boolean,
    Duration?: number,
    Sqlite?: boolean,
    SteamCommunity_Jar?: any,
    tradableOnly?: boolean,
    Test?: boolean
}

const Worker = (SteamID64: string, appID: string | number, contextID: string | number, Config: Config): Promise<AzulInventoryResponse> => {

    const Defaults = {
        Cache: Config?.Cache || false,
        Duration: Config?.Duration || 15,
        Sqlite: Config?.Sqlite || false,
        SteamCommunity_Jar: Config?.SteamCommunity_Jar || undefined,
        tradableOnly: Config?.tradableOnly || true,
        Test: Config?.Test || false,
    };

    return WorkerLoader(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Sqlite, Defaults.Cache, Defaults.Duration, Defaults.Test);
}

const rawLoader = (SteamID64: string, appID: string | number, contextID: string | number, Config: Config): Promise<AzulInventoryResponse> => {

    const Defaults = {
        Cache: Config?.Cache || false,
        Duration: Config?.Duration || 15,
        Sqlite: Config?.Sqlite || false,
        SteamCommunity_Jar: Config?.SteamCommunity_Jar || undefined,
        tradableOnly: Config?.tradableOnly || true,
        Test: Config?.Test || false,
    };

    return RawLoader(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Sqlite, Defaults.Cache, Defaults.Duration, Defaults.Test);
}

export default {
    Loader: {
        Worker,
        Raw: rawLoader
    },
    getTag, getImageURL, getLargeImageURL, CleanCache, isCardType
};