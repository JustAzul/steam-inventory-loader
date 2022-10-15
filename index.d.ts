/* eslint-disable no-shadow */
/* eslint-disable max-len */
import type { AzulInventoryResponse } from './src/types/azul-inventory-response.type'
import type { ItemDescription } from './src/types/item-description.type'
import type { ItemDetails } from './src/types/item-details.type'
import type { OptionalConfig } from './src/types/optional-config.type'
import type { Tag } from './src/types/tag.type'
declare namespace AzulInventoryLoader {

    export function Loader(SteamID64: string, appID: string | number, contextID: string | number, optionalConfig?: OptionalConfig): Promise<AzulInventoryResponse>;
    export function getTag(tags: Tag[], category: string): Tag | undefined;
    export function getImageURL(CEconItem: ItemDescription | ItemDetails): string;
    export function getLargeImageURL(CEconItem: ItemDescription | ItemDetails): string;
    export function isCardType(tags: Tag[]): boolean | 'Normal' | 'Foil' | undefined
}

export = AzulInventoryLoader;
