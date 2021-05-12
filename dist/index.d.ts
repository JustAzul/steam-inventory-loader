import { AzulInventoryResponse } from './getInventory';
export interface Config {
    SteamCommunity_Jar?: any;
    tradableOnly?: boolean;
    Language?: string;
}
declare const _default: {
    Loader: (SteamID64: string, appID: string | number, contextID: string | number, LoaderConfig: Config) => Promise<AzulInventoryResponse>;
    getTag: (tags: import("./CEconItem").Tag[], category: string) => import("./CEconItem").Tag | null;
    getImageURL: ({ icon_url }: import("./CEconItem").ItemDescription | import("./CEconItem").ItemDetails) => string;
    getLargeImageURL: ({ icon_url_large, icon_url }: import("./CEconItem").ItemDescription | import("./CEconItem").ItemDetails) => string;
    isCardType: (tags: import("./CEconItem").Tag[]) => false | "Normal" | "Foil" | undefined;
};
export default _default;
//# sourceMappingURL=index.d.ts.map