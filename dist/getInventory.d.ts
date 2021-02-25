import steamID from 'steamid';
import { Tag, ItemDescription, ItemDetails } from './CEconItem';
export interface AzulInventoryResponse {
    success: boolean;
    inventory: ItemDetails[];
    count: number;
}
export declare const getTag: (tags: Tag[], category: string) => Tag | null;
export declare const getLargeImageURL: ({ icon_url_large, icon_url }: ItemDescription | ItemDetails) => string;
export declare const getImageURL: ({ icon_url }: ItemDescription | ItemDetails) => string;
export declare const isCardType: (tags: Tag[]) => undefined | false | 'Normal' | 'Foil';
declare function getInventory(SteamID64: string | steamID, appID: string | number, contextID: string | number, tradableOnly: boolean | undefined, SteamCommunity_Jar: any, useCache?: boolean, CacheDuration?: number, useGC?: boolean): Promise<AzulInventoryResponse>;
export default getInventory;
//# sourceMappingURL=getInventory.d.ts.map