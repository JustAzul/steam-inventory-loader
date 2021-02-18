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
async function getInventory(SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, useSqlite = false, useCache = true, CacheDuration = 15, test = false) {
    if (typeof SteamID64 !== "string")
        SteamID64 = SteamID64.getSteamID64();
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
        if (test)
            console.time(`${SteamID64}/${inventory.length} Request`);
        const { statusCode, body } = await got(got_o);
        if (test)
            console.timeEnd(`${SteamID64}/${inventory.length} Request`);
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
            console.time(`${SteamID64}/${inventory.length} Parse`);
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
        if (test)
            console.timeEnd(`${SteamID64}/${inventory.length} Parse`);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4Q0FBdUI7QUFDdkIsb0VBQXVDO0FBQ3ZDLG1DQUFnQztBQUNoQyw0REFBb0Y7QUFDcEYsa0VBQTBDO0FBQzFDLDBEQUFrQztBQUdsQyxNQUFNLEtBQUssR0FBRztJQUNWLElBQUksRUFBRSxJQUFJLHdCQUFTLEVBQUU7SUFDckIsS0FBSyxFQUFFLElBQUksd0JBQVMsQ0FBQyxVQUFVLEVBQUU7Q0FDcEMsQ0FBQTtBQUVELE1BQU0sR0FBRyxHQUFHLGFBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLGlCQUFRLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFDLENBQUMsQ0FBQztBQW9CN0UsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFXLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO0lBQ3ZELElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFdkIsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDckIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLFFBQVE7WUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNqRDtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQyxDQUFDO0FBUlcsUUFBQSxNQUFNLFVBUWpCO0FBRUssTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEVBQUMsY0FBYyxFQUFFLFFBQVEsRUFBZ0MsRUFBRSxFQUFFLENBQUMsdURBQXVELGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQztBQUF2TCxRQUFBLGdCQUFnQixvQkFBdUs7QUFDN0wsTUFBTSxXQUFXLEdBQUcsQ0FBQyxFQUFDLFFBQVEsRUFB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