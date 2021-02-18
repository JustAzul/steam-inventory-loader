import WorkerLoader from './Worker/getInventory';
import RawLoader, {getTag, getImageURL, getLargeImageURL, AzulInventoryResponse} from './getInventory';
import {CleanCache} from './Database'

interface Config {
    Cache?: boolean,
    Duration?: number,
    Sqlite?: boolean,
    SteamCommunity_Jar?: any,
    tradableOnly?: boolean
}

const Worker = (SteamID64: string, appID: string | number, contextID: string | number, Config: Config): Promise<AzulInventoryResponse> => {

    const Defaults = {
        Cache: Config.Cache || false,
        Duration: Config.Duration || 15,
        Sqlite: Config.Sqlite || false,
        SteamCommunity_Jar: Config.SteamCommunity_Jar || undefined,
        tradableOnly: Config.tradableOnly || true
    };

    return WorkerLoader(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Sqlite, Defaults.Cache, Defaults.Duration);
}

const rawLoader = (SteamID64: string, appID: string | number, contextID: string | number, Config: Config): Promise<AzulInventoryResponse> => {

    const Defaults = {
        Cache: Config.Cache || false,
        Duration: Config.Duration || 15,
        Sqlite: Config.Sqlite || false,
        SteamCommunity_Jar: Config.SteamCommunity_Jar || undefined,
        tradableOnly: Config.tradableOnly || true
    };

    return RawLoader(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Sqlite, Defaults.Cache, Defaults.Duration);
}

export default {
    Loader: {
        Worker,
        Raw: rawLoader
    },
    getTag, getImageURL, getLargeImageURL, CleanCache
};