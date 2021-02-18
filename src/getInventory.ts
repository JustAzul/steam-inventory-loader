import _got from 'got';
import HttpAgent from 'agentkeepalive';
import {duration} from 'moment';
import CEconItem, {Tag, ItemAsset, ItemDescription, ItemDetails} from './CEconItem';
import CookieParser from './CookieParser';
import Database from './Database';
import steamID from 'steamid';
import NodeCache from 'node-cache';

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

async function getInventory(SteamID64: string | steamID , appID: string | number, contextID: string | number, tradableOnly: boolean = true, SteamCommunity_Jar: any, useCache: boolean = true, CacheDuration: number = 15, test: boolean = false, useGC: boolean = false) {
    
    if(typeof SteamID64 !== "string") SteamID64 = SteamID64.getSteamID64();
    
    const CacheKey = `${SteamID64}_${appID}_${contextID}_${tradableOnly}`;

    const Cache = new NodeCache();

    if (useCache) {
        Database.InitCache();
        const Cache = Database.GetCache(CacheKey, CacheDuration);
        if (Cache) return Cache;
    }

    const headers = {
        Referer: `https://steamcommunity.com/profiles/${SteamID64}/inventory`,
        Host: "steamcommunity.com"
    };

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

        const TestKey = `${SteamID64}/${inventory.length}`;

        if(test) console.time(`${TestKey} Request`);

        const { statusCode, body }: {
            statusCode: number,
            body: string
        } = await got(got_o);

        if(test) console.timeEnd(`${TestKey} Request`);

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

        if (test) console.time(`${TestKey} Parse`);

        //parse descs
        for (const i in data.descriptions) {
            const Key = `${data.descriptions[i].classid}_${(data.descriptions[i].instanceid || '0')}_${data.descriptions[i].appid}`;
            if (!Cache.has(Key)) Cache.set(Key, data.descriptions[i]);
        }
        
        // @ts-expect-error
        data.descriptions = null;

        if (test) {
            console.timeEnd(`${TestKey} Parse`);
            console.time(`${TestKey} Set`);
        }

        for (const i in data.assets) {
            const Key = `${data.assets[i].classid}_${(data.assets[i].instanceid || '0')}_${data.assets[i].appid}`;
            let description: any = Cache.get(Key);

            if (!tradableOnly || (description && description.tradable)) {
                if (data.assets[i].currencyid) continue; //Ignore Currencies..
                inventory.push(await CEconItem(data.assets[i], description, contextID.toString()));
            }
        }

        // @ts-expect-error
        data.assets = null;

        if (test) console.timeEnd(`${TestKey} Set`);
        
        // if(test) console.timeEnd(`${TestKey} Parse`);
        
        if(useGC && global?.gc) global?.gc();
        if (data.more_items) return Get(inventory, data.last_assetid);

        const o = {
            success: true,
            inventory,
            count: inventory.length
        }

        return o;    
    }
    
    if(test) console.time(`${SteamID64}`);
    
    const InventoryResult = await Get([], undefined);
    
    if(test) {
        console.timeEnd(`${SteamID64}`);
        console.log(`Inventory Size: ${InventoryResult.count}`)
    }
    
    // if(useGC && global?.gc) global?.gc();
    Cache.flushAll();

    if (useCache) Database.SaveCache(CacheKey, InventoryResult);
    return InventoryResult;
};

export default getInventory;