import { AzulInventoryResponse } from '../getInventory';
declare const getInventory: (SteamID64: string, appID: string | number, contextID: string | number, tradableOnly: boolean | undefined, SteamCommunity_Jar: any, useSqlite?: boolean, useCache?: boolean, CacheDuration?: number, test?: boolean) => Promise<AzulInventoryResponse>;
export default getInventory;
//# sourceMappingURL=getInventory.d.ts.map