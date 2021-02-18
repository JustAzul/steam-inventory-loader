"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCardType = exports.getImageURL = exports.getLargeImageURL = exports.getTag = void 0;
const got_1 = __importDefault(require("got"));
const moment_1 = require("moment");
const CEconItem_1 = __importDefault(require("./CEconItem"));
const CookieParser_1 = __importDefault(require("./CookieParser"));
const Database_1 = __importDefault(require("./Database"));
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
async function getInventory(SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, useSqlite = false, useCache = true, CacheDuration = 15) {
    const CacheKey = `${SteamID64}_${appID}_${contextID}_${tradableOnly}`;
    if (useCache) {
        Database_1.default.InitCache();
        const Cache = Database_1.default.GetCache(CacheKey, CacheDuration);
        if (Cache)
            return Cache;
    }
    if (useSqlite)
        Database_1.default.InitDescriptions();
    const headers = {
        Referer: `https://steamcommunity.com/profiles/${SteamID64}/inventory`,
        Host: "steamcommunity.com"
    };
    let quickLookup = {};
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
            cookieJar: SteamCommunity_Jar ? CookieParser_1.default(SteamCommunity_Jar._jar.store.idx) : undefined,
            throwHttpErrors: false,
            timeout: moment_1.duration(50, 'seconds').asMilliseconds()
        };
        const { statusCode, body } = await got_1.default(got_o);
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
        for (const i in data.descriptions) {
            const Key = `${data.descriptions[i].classid}_${(data.descriptions[i].instanceid || '0')}_${data.descriptions[i].appid}`;
            if (useSqlite)
                Database_1.default.saveDescription(Key, data.descriptions[i]);
            else if (!quickLookup[Key])
                quickLookup[Key] = data.descriptions[i];
        }
        data.descriptions = null;
        for (const i in data.assets) {
            const Key = `${data.assets[i].classid}_${(data.assets[i].instanceid || '0')}_${data.assets[i].appid}`;
            let description = useSqlite ? Database_1.default.getDescription(Key) : quickLookup[Key];
            if (!tradableOnly || (description && description.tradable)) {
                if (data.assets[i].currencyid)
                    continue;
                let item = await CEconItem_1.default(data.assets[i], description, contextID.toString());
                description = null;
                inventory.push(item);
            }
        }
        if (global?.gc)
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
    const InventoryResult = await Get([], undefined);
    quickLookup = null;
    if (global?.gc)
        global?.gc();
    if (useCache)
        Database_1.default.SaveCache(CacheKey, InventoryResult);
    return InventoryResult;
}
;
exports.default = getInventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4Q0FBc0I7QUFDdEIsbUNBQWdDO0FBQ2hDLDREQUFvRjtBQUNwRixrRUFBMEM7QUFDMUMsMERBQWtDO0FBb0IzQixNQUFNLE1BQU0sR0FBRyxDQUFDLElBQVcsRUFBRSxRQUFnQixFQUFFLEVBQUU7SUFDdkQsSUFBSSxDQUFDLElBQUk7UUFBRSxPQUFPLElBQUksQ0FBQztJQUV2QixLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksRUFBRTtRQUNyQixJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksUUFBUTtZQUFFLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDYixDQUFDLENBQUM7QUFSVyxRQUFBLE1BQU0sVUFRakI7QUFFSyxNQUFNLGdCQUFnQixHQUFHLENBQUMsRUFBQyxjQUFjLEVBQUUsUUFBUSxFQUFnQyxFQUFFLEVBQUUsQ0FBQyx1REFBdUQsY0FBYyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDO0FBQXZMLFFBQUEsZ0JBQWdCLG9CQUF1SztBQUM3TCxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQUMsUUFBUSxFQUFnQyxFQUFFLEVBQUUsQ0FBQyx1REFBdUQsUUFBUSxHQUFHLENBQUM7QUFBaEksUUFBQSxXQUFXLGVBQXFIO0FBRXRJLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBVyxFQUFFLEVBQUU7SUFFdEMsSUFBRyxDQUFDLElBQUk7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUV2QixJQUFJO1FBQ0EsSUFBSSxjQUFNLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxFQUFFLGFBQWEsSUFBSSxjQUFjLEVBQUU7WUFDOUQsSUFBSSxjQUFNLENBQUMsSUFB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