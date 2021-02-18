import { AzulInventoryResponse } from './getInventory';
export interface Config {
    Cache?: boolean;
    Duration?: number;
    SteamCommunity_Jar?: any;
    tradableOnly?: boolean;
    Test?: boolean;
    enableGC?: boolean;
}
declare const _default: {
    Loader: (SteamID64: string, appID: string | number, contextID: string | number, Config: Config) => Promise<AzulInventoryResponse>;
    getTag: (tags: import("./CEconItem").Tag[], category: string) => import("./CEconItem").Tag | null;
    getImageURL: ({ icon_url }: import("./CEconItem").ItemDescription | import("./CEconItem").ItemDetails) => string;
    getLargeImageURL: ({ icon_url_large, icon_url }: import("./CEconItem").ItemDescription | import("./CEconItem").ItemDetails) => string;
    CleanCache: (MaxDuration: number) => void;
    isCardType: (tags: import("./CEconItem").Tag[]) => false | "Normal" | "Foil" | undefined;
};
export default _default;
//# sourceMappingURL=index.d.ts.map