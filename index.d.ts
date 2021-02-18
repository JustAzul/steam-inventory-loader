import type {Config} from './src';
import type {AzulInventoryResponse} from './src/getInventory';
import type {Tag, ItemDescription, ItemDetails} from './src/CEconItem';

declare namespace AzulInventoryLoader {

    export function Loader(SteamID64: string, appID: string | number, contextID: string | number, Config: Config): Promise<AzulInventoryResponse>;
    export function getTag(tags: Tag[], category: string): Tag | null;
    export function getImageURL(CEconItem: ItemDescription | ItemDetails): string;
    export function getLargeImageURL(CEconItem: ItemDescription | ItemDetails): string;
    export function CleanCache(MaxDuration: number): void;
    export function isCardType(tags: Tag[]): boolean | "Normal" | "Foil" | undefined

}

export = AzulInventoryLoader;