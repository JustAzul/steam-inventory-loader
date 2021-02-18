import { Tag, ItemDescription, ItemDetails } from './CEconItem';
import steamID from 'steamid';
export interface AzulInventoryResponse {
    success: boolean;
    inventory: ItemDetails[];
    count: number;
}
export declare const getTag: (tags: Tag[], category: string) => Tag | null;
export declare const getLargeImageURL: ({ icon_url_large, icon_url }: ItemDescription | ItemDetails) => string;
export declare const getImageURL: ({ icon_url }: ItemDescription | ItemDetails) => string;
export declare const isCardType: (tags: Tag[]) => false | "Normal" | "Foil" | undefined;
declare function getInventory(SteamID64: string | steamID, appID: string | number, contextID: string | number, tradableOnly: boolean | undefined, SteamCommunity_Jar: any, useSqlite?: boolean, useCache?: boolean, CacheDuration?: number, test?: boolean): Promise<any>;
export default getInventory;
//# sourceMappingURL=getInventory.d.ts.map