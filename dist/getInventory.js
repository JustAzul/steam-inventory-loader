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
        const agent = {
            http: new agentkeepalive_1.default(),
            https: new agentkeepalive_1.default.HttpsAgent()
        };
        const got_o = {
            url: `https://steamcommunity.com/inventory/${SteamID64}/${appID}/${contextID}`,
            headers,
            searchParams,
            cookieJar: SteamCommunity_Jar ? CookieParser_1.default(SteamCommunity_Jar._jar.store.idx) : undefined,
            throwHttpErrors: false,
            timeout: moment_1.duration(50, 'seconds').asMilliseconds(),
            agent
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4Q0FBc0I7QUFDdEIsb0VBQXVDO0FBQ3ZDLG1DQUFnQztBQUNoQyw0REFBb0Y7QUFDcEYsa0VBQTBDO0FBQzFDLDBEQUFrQztBQW9CM0IsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFXLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO0lBQ3ZELElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFdkIsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDckIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLFFBQVE7WUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNqRDtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQyxDQUFDO0FBUlcsUUFBQSxNQUFNLFVBUWpCO0FBRUssTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEVBQUMsY0FBYyxFQUFFLFFBQVEsRUFBZ0MsRUFBRSxFQUFFLENBQUMsdURBQXVELGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQztBQUF2TCxRQUFBLGdCQUFnQixvQkFBdUs7QUFDN0wsTUFBTSxXQUFXLEdBQUcsQ0FBQyxFQUFDLFFBQVEsRUFBZ0MsRUFBRSxFQUFFLENBQUMsdURBQXVELFFBQVEsR0FBRyxDQUFDO0FBQWhJLFFBQUEsV0FBVyxlQUFxSDtBQUV0SSxNQUFNLFVBQVUsR0FBRyxDQUFDLElBQVcsRUFBRSxFQUFFO0lBRXRDLElBQUcsQ0FBQyxJQUFJO1FBQUUsT0FBTyxLQUFLLENBQUM7SUFFdkIsSUFBSTtRQUNBLElBQUksY0FBTSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsRUFBRSxhQUFhLElBQUksY0FBYyxFQUFFO1lBQzlELElBQUks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