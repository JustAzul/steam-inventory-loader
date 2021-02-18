"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCardType = exports.getImageURL = exports.getLargeImageURL = exports.getTag = void 0;
const got_1 = __importDefault(require("got"));
const agentkeepalive_1 = __importDefault(require("agentkeepalive"));
const moment_1 = require("moment");
const CEconItem_1 = __importDefault(require("./CEconItem"));
const CookieParser_1 = __importDefault(require("./CookieParser"));
const Database_1 = __importDefault(require("./Database"));
const node_cache_1 = __importDefault(require("node-cache"));
const agent = {
    http: new agentkeepalive_1.default(),
    https: new agentkeepalive_1.default.HttpsAgent()
};
const got = got_1.default.extend({ agent, timeout: moment_1.duration(50, 'seconds').asMilliseconds() });
const getTag = (tags, category) => {
    if (!tags)
        return null;
    for (const i in tags) {
        if (tags[i].category == category)
            return tags[i];
    }
    return null;
};
exports.getTag = getTag;
const getLargeImageURL = ({ icon_url_large, icon_url }) => `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url_large ? icon_url_large : icon_url}/`;
exports.getLargeImageURL = getLargeImageURL;
const getImageURL = ({ icon_url }) => `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url}/`;
exports.getImageURL = getImageURL;
const isCardType = (tags) => {
    if (!tags)
        return false;
    try {
        if (exports.getTag(tags, "item_class")?.internal_name == "item_class_2") {
            if (exports.getTag(tags, "cardborder")?.internal_name == "cardborder_0")
                return "Normal";
            if (exports.getTag(tags, "cardborder")?.internal_name == "cardborder_1")
                return "Foil";
        }
    }
    catch {
        return false;
    }
};
exports.isCardType = isCardType;
async function getInventory(SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, useCache = true, CacheDuration = 15, test = false, useGC = false) {
    if (typeof SteamID64 !== "string")
        SteamID64 = SteamID64.getSteamID64();
    const CacheKey = `${SteamID64}_${appID}_${contextID}_${tradableOnly}`;
    const Cache = new node_cache_1.default();
    if (useCache) {
        Database_1.default.InitCache();
        const Cache = Database_1.default.GetCache(CacheKey, CacheDuration);
        if (Cache)
            return Cache;
    }
    const headers = {
        Referer: `https://steamcommunity.com/profiles/${SteamID64}/inventory`,
        Host: "steamcommunity.com"
    };
    const cookieJar = SteamCommunity_Jar ? CookieParser_1.default(SteamCommunity_Jar._jar.store.idx) : undefined;
    async function Get(inventory, start_assetid) {
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
        if (test)
            console.time(`${TestKey} Request`);
        const { statusCode, body } = await got(got_o);
        if (test)
            console.timeEnd(`${TestKey} Request`);
        if (statusCode === 403 && body == "null")
            throw new Error("This profile is private.");
        if (statusCode === 429)
            throw new Error("rate limited");
        let data = JSON.parse(body);
        if (statusCode === 500 && body && data.error) {
            let _Err = new Error(data.error);
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
            };
            return o;
        }
        if (!data || !data.success || !data?.assets || !data?.descriptions) {
            if (data)
                throw new Error(data?.error || data?.Error || "Malformed response");
            throw new Error("Malformed response");
        }
        if (test)
            console.time(`${TestKey} Parse`);
        for (const i in data.descriptions) {
            const Key = `${data.descriptions[i].classid}_${(data.descriptions[i].instanceid || '0')}_${data.descriptions[i].appid}`;
            if (!Cache.has(Key))
                Cache.set(Key, data.descriptions[i]);
        }
        data.descriptions = null;
        if (test) {
            console.timeEnd(`${TestKey} Parse`);
            console.time(`${TestKey} Set`);
        }
        for (const i in data.assets) {
            const Key = `${data.assets[i].classid}_${(data.assets[i].instanceid || '0')}_${data.assets[i].appid}`;
            let description = Cache.take(Key);
            if (!tradableOnly || (description && description.tradable)) {
                if (data.assets[i].currencyid)
                    continue;
                inventory.push(await CEconItem_1.default(data.assets[i], description, contextID.toString()));
            }
        }
        data.assets = null;
        if (test)
            console.timeEnd(`${TestKey} Set`);
        if (useGC && global?.gc)
            global?.gc();
        if (data.more_items)
            return Get(inventory, data.last_assetid);
        const o = {
            success: true,
            inventory,
            count: inventory.length
        };
        return o;
    }
    if (test)
        console.time(`${SteamID64}`);
    const InventoryResult = await Get([], undefined);
    if (test) {
        console.timeEnd(`${SteamID64}`);
        console.log(`Inventory Size: ${InventoryResult.count}`);
    }
    Cache.flushAll();
    if (useCache)
        Database_1.default.SaveCache(CacheKey, InventoryResult);
    return InventoryResult;
}
;
exports.default = getInventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4Q0FBdUI7QUFDdkIsb0VBQXVDO0FBQ3ZDLG1DQUFnQztBQUNoQyw0REFBb0Y7QUFDcEYsa0VBQTBDO0FBQzFDLDBEQUFrQztBQUVsQyw0REFBbUM7QUFFbkMsTUFBTSxLQUFLLEdBQUc7SUFDVixJQUFJLEVBQUUsSUFBSSx3QkFBUyxFQUFFO0lBQ3JCLEtBQUssRUFBRSxJQUFJLHdCQUFTLENBQUMsVUFBVSxFQUFFO0NBQ3BDLENBQUE7QUFFRCxNQUFNLEdBQUcsR0FBRyxhQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxpQkFBUSxDQUFDLEVBQUUsRUFBRSxTQUFTLENBQUMsQ0FBQyxjQUFjLEVBQUUsRUFBQyxDQUFDLENBQUM7QUFvQjdFLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBVyxFQUFFLFFBQWdCLEVBQUUsRUFBRTtJQUN2RCxJQUFJLENBQUMsSUFBSTtRQUFFLE9BQU8sSUFBSSxDQUFDO0lBRXZCLEtBQUssTUFBTSxDQUFDLElBQUksSUFBSSxFQUFFO1FBQ3JCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsSUFBSSxRQUFRO1lBQUUsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDakQ7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNiLENBQUMsQ0FBQztBQVJXLFFBQUEsTUFBTSxVQVFqQjtBQUVLLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxFQUFDLGNBQWMsRUFBRSxRQUFRLEVBQWdDLEVBQUUsRUFBRSxDQUFDLHVEQUF1RCxjQUFjLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFHLENBQUM7QUFBdkwsUUFBQSxnQkFBZ0Isb0JBQXVLO0FBQzdMLE1BQU0sV0FBVyxHQUFHLENBQUMs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