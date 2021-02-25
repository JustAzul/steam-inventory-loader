import { AzulInventoryResponse } from './getInventory';
export declare const InitCache: () => void;
export declare const CleanCache: (MaxDuration: number) => void;
export declare const GetCache: (Key: string, Seconds?: number) => AzulInventoryResponse | undefined;
export declare const SaveCache: (Key: string, contents: AzulInventoryResponse) => void;
declare const _default: {
    InitCache: () => void;
    GetCache: (Key: string, Seconds?: number) => AzulInventoryResponse | undefined;
    SaveCache: (Key: string, contents: AzulInventoryResponse) => void;
};
export default _default;
//# sourceMappingURL=Database.d.ts.map