import _got from 'got';
import HttpAgent from 'agentkeepalive';
import {duration} from 'moment';
import CEconItem, {Tag, ItemAsset, ItemDescription, ItemDetails} from './CEconItem';
import CookieParser from './CookieParser';
import Database from './Database';
import steamID from 'steamid';

const agent = {
    http: new HttpAgent(),
    https: new HttpAgent.HttpsAgent()
}

const got = _got.extend({agent, timeout: duration(50, 'seconds').asMilliseconds()});

interface SteamBodyResponse {
    error?: string,
    Error?: string,
    assets: ItemAsset[],
    descriptions: ItemDescription[],
    more_items?: number,
    last_assetid: string,
    total_inventory_count: number,
    success: number,
    rwgrsn: number
}

export interface AzulInventoryResponse {
    success: boolean,
    inventory: ItemDetails[],
    count: number
}

export const getTag = (tags: Tag[], category: string) => {
	if (!tags) return null;

	for (const i in tags) {
		if (tags[i].category == category) return tags[i];
	}

	return null;
};

export const getLargeImageURL = ({icon_url_large, icon_url}: ItemDescription | ItemDetails) => `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url_large ? icon_url_large : icon_url}/`;
export const getImageURL = ({icon_url}: ItemDescription | ItemDetails) => `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url}/`;

export const isCardType = (tags: Tag[]) => {
    
    if(!tags) return false;

    try {
        if (getTag(tags, "item_class")?.internal_name == "item_class_2") {
           if (getTag(tags, "cardborder")?.internal_name == "cardborder_0") return "Normal";
           if (getTag(tags, "cardborder")?.internal_name == "cardborder_1") return "Foil";
        }
     } catch {
         return false;
     }
};

async function getInventory(SteamID64: string | steamID , appID: string | number, contextID: string | number, tradableOnly: boolean = true, SteamCommunity_Jar: any, useSqlite: boolean = false, useCache: boolean = true, CacheDuration: number = 15, test: boolean = false) {
    
    if(typeof SteamID64 !== "string") SteamID64 = SteamID64.getSteamID64();

    const CacheKey = `${SteamID64}_${appID}_${contextID}_${tradableOnly}`;
    
    if (useCache) {
        Database.InitCache();
        const Cache = Database.GetCache(CacheKey, CacheDuration);
        if (Cache) return Cache;
    }

    if (useSqlite) Database.InitDescriptions();
    
    const headers = {
        Referer: `https://steamcommunity.com/profiles/${SteamID64}/inventory`,
        Host: "steamcommunity.com"
    }; 

    // let pos = 1;
    let quickLookup: {
        [key: string]: ItemDescription
    } = {};

    const cookieJar = SteamCommunity_Jar ? CookieParser(SteamCommunity_Jar._jar.store.idx) : undefined;

    async function Get(inventory: ItemDetails[], start_assetid: string | undefined): Promise<AzulInventoryResponse> {
        
        const searchParams = {
            l: "english",
            count: 5000,
            start_assetid
        };
        
        const got_o = {
            url: `https://steamcommunity.com/inventory/${SteamID64}/${appID}/${contextID}`,
            headers,
            searchParams,
            cookieJar,
            throwHttpErrors: false
        };

        if(test) console.time(`${SteamID64}/${inventory.length} Request`);

        const { statusCode, body }: {
            statusCode: number,
            body: string
        } = await got(got_o);

        if(test) console.timeEnd(`${SteamID64}/${inventory.length} Request`);

        if (statusCode === 403 && body == "null") throw new Error("This profile is private.");
        if(statusCode === 429) throw new Error("rate limited");
        
        let data: SteamBodyResponse = JSON.parse(body);

        if (statusCode === 500 && body && data.error) {
            let _Err: any = new Error(data.error);
            
            const match = data.error.match(/^(.+) \((\d+)\)$/);
            
            if (match) {
                _Err.message = match[1];
                _Err.eresult = match[2];
            }

            throw _Err;
        }

        if (!!data?.success && data?.total_inventory_count === 0) {

            const o = {
                success: !!data.success,
                inventory,
                count: data.total_inventory_count ?? 0
            }

            return o;
        }
        
        if (!data || !data.success || !data?.assets || !data?.descriptions) {
            if (data) throw new Error(data?.error || data?.Error || "Malformed response");
            throw new Error("Malformed response");
        }

        if(test) console.time(`${SteamID64}/${inventory.length} Parse`);
        
        //parse descs
        for(const i in data.descriptions) {
            const Key = `${data.descriptions[i].classid}_${(data.descriptions[i].instanceid || '0')}_${data.descriptions[i].appid}`;            
            if(useSqlite) Database.saveDescription(Key, data.descriptions[i]);
            else if(!quickLookup[Key]) quickLookup[Key] = data.descriptions[i];
        }

        // @ts-expect-error
        data.descriptions = null;
        
        for (const i in data.assets) {
            const Key = `${data.assets[i].classid}_${(data.assets[i].instanceid || '0')}_${data.assets[i].appid}`;
            let description = useSqlite ? Database.getDescription(Key) : quickLookup[Key];
            //const description = JSON.parse(getItemDesc(Key)) || undefined;
            
            if (!tradableOnly || (description && description.tradable)) {
                // data.assets[i].pos = pos++;

                if(data.assets[i].currencyid) continue; //Ignore Currencies..

                let item = await CEconItem(data.assets[i], description, contextID.toString());

                /* // @ts-expect-error */
                description = null;

                inventory.push(item);
            }
        }

        if(test) console.timeEnd(`${SteamID64}/${inventory.length} Parse`);

        if(global?.gc) global?.gc();
        if (data.more_items) return Get(inventory, data.last_assetid);

        const o = {
            success: true,
            inventory,
            count: inventory.length
        }

        return o;    
    }
    
    const InventoryResult = await Get([], undefined);
    
    // @ts-expect-error
    quickLookup = null;
    
    if(global?.gc) global?.gc();

    if (useCache) Database.SaveCache(CacheKey, InventoryResult);
    return InventoryResult;
};

export default getInventory;