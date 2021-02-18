export declare const InitDescriptions: () => void;
export declare const InitCache: () => void;
export declare const CleanCache: (MaxDuration: number) => void;
export declare const GetCache: (Key: string, Seconds?: number) => any;
export declare const SaveCache: (Key: string, contents: any) => void;
export declare const saveDescription: (Key: string, Value: object) => void;
export declare const getDescription: (Key: string) => any;
declare const _default: {
    InitDescriptions: () => void;
    saveDescription: (Key: string, Value: object) => void;
    getDescription: (Key: string) => any;
    InitCache: () => void;
    GetCache: (Key: string, Seconds?: number) => any;
    SaveCache: (Key: string, contents: any) => void;
};
export default _default;
//# sourceMappingURL=Database.d.ts.map