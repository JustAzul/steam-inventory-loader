import { AzulInventoryResponse } from './getInventory';
interface Config {
    Cache?: boolean;
    Duration?: number;
    Sqlite?: boolean;
    SteamCommunity_Jar?: any;
    tradableOnly?: boolean;
}
declare const _default: {
    Loader: {
        Worker: (SteamID64: string, appID: string | number, contextID: string | number, Config: Config) => Promise<AzulInventoryResponse>;
        Raw: (SteamID64: string, appID: string | number, contextID: string | number, Config: Config) => Promise<AzulInventoryResponse>;
    };
    getTag: (tags: import("./CEconItem").Tag[], category: string) => import("./CEconItem").Tag | null;
    getImageURL: ({ icon_url }: import("./CEconItem").ItemDescription | import("./CEconItem").ItemDetails) => string;
    getLargeImageURL: ({ icon_url_large, icon_url }: import("./CEconItem").ItemDescription | import("./CEconItem").ItemDetails) => string;
};
export default _default;
//# sourceMappingURL=index.d.ts.map