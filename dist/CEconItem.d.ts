export interface ItemAsset {
    amount: string;
    appid: number;
    assetid: string;
    classid: string;
    contextid: string;
    instanceid: string;
    is_currency?: any;
    currency?: any;
    currencyid?: any;
}
export interface Tag {
    internal_name: string;
    name: string;
    category: string;
    color: string;
    category_name: string;
}
export interface rawTag {
    category: string;
    internal_name: string;
    localized_category_name?: string;
    localized_tag_name: string;
    category_name: string;
    color?: string;
    name?: string;
}
export interface InnerItemDescription {
    value: string;
}
export interface ItemActions {
    link: string;
    name: string;
}
export interface ItemDescription {
    actions: ItemActions[];
    appid: number;
    background_color: string;
    classid: string;
    commodity: number;
    currency: number;
    descriptions: InnerItemDescription[];
    owner_descriptions?: InnerItemDescription[];
    icon_url: string;
    icon_url_large: string;
    instanceid: string;
    market_fee_app: number;
    market_hash_name: string;
    market_marketable_restriction: number;
    market_name: string;
    market_tradable_restriction: number;
    marketable: number;
    name: string;
    tags: rawTag[];
    tradable: number;
    type: string;
    item_expiration?: string;
    [ListingKey: string]: any;
}
export interface ItemDetails {
    id: string;
    is_currency: boolean;
    instanceid: string;
    amount: number;
    contextid: string;
    appid: number;
    assetid: string;
    classid: string;
    tradable: boolean;
    marketable: boolean;
    commodity: boolean;
    fraudwarnings: [];
    descriptions: InnerItemDescription[];
    owner_descriptions?: InnerItemDescription[];
    market_hash_name: string;
    market_tradable_restriction: number;
    market_marketable_restriction: number;
    market_fee_app?: number;
    cache_expiration?: string;
    item_expiration?: string;
    tags?: Tag[];
    actions: ItemActions[];
    owner_actions?: ItemActions[];
    background_color: string;
    currency: number;
    icon_url: string;
    icon_url_large: string;
    market_name: string;
    name: string;
    type: string;
}
declare function ItemParser(item: ItemAsset, description: ItemDescription, contextID: string, useSqlite?: boolean): Promise<ItemDetails>;
export default ItemParser;
//# sourceMappingURL=CEconItem.d.ts.map