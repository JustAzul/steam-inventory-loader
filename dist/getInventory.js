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
async function getInventory(SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, useCache = true, CacheDuration = 15, test = false, useGC = false) {
    if (typeof SteamID64 !== "string")
        SteamID64 = SteamID64.getSteamID64();
    const CacheKey = `${SteamID64}_${appID}_${contextID}_${tradableOnly}`;
    let DescriptionsCache = {};
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
            if (!DescriptionsCache.hasOwnProperty(Key))
                DescriptionsCache[Key] = data.descriptions[i];
        }
        data.descriptions = null;
        if (test) {
            console.timeEnd(`${TestKey} Parse`);
            console.time(`${TestKey} Set`);
        }
        for (const i in data.assets) {
            const Key = `${data.assets[i].classid}_${(data.assets[i].instanceid || '0')}_${data.assets[i].appid}`;
            let description = DescriptionsCache[Key];
            if (!tradableOnly || (description && description.tradable)) {
                if (data.assets[i].currencyid)
                    continue;
                inventory.push(await CEconItem_1.default(data.assets[i], description, contextID.toString()));
            }
        }
        data.assets = null;
        if (test)
            console.timeEnd(`${TestKey} Set`);
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
    DescriptionsCache = null;
    if (useGC && global?.gc)
        global?.gc();
    if (useCache)
        Database_1.default.SaveCache(CacheKey, InventoryResult);
    return InventoryResult;
}
;
exports.default = getInventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSw4Q0FBdUI7QUFDdkIsb0VBQXVDO0FBQ3ZDLG1DQUFnQztBQUNoQyw0REFBb0Y7QUFDcEYsa0VBQTBDO0FBQzFDLDBEQUFrQztBQUdsQyxNQUFNLEtBQUssR0FBRztJQUNWLElBQUksRUFBRSxJQUFJLHdCQUFTLEVBQUU7SUFDckIsS0FBSyxFQUFFLElBQUksd0JBQVMsQ0FBQyxVQUFVLEVBQUU7Q0FDcEMsQ0FBQTtBQUVELE1BQU0sR0FBRyxHQUFHLGFBQUksQ0FBQyxNQUFNLENBQUMsRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLGlCQUFRLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFDLENBQUMsQ0FBQztBQW9CN0UsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFXLEVBQUUsUUFBZ0IsRUFBRSxFQUFFO0lBQ3ZELElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFdkIsS0FBSyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDckIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxJQUFJLFFBQVE7WUFBRSxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNqRDtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQyxDQUFDO0FBUlcsUUFBQSxNQUFNLFVBUWpCO0FBRUssTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEVBQUMsY0FBYyxFQUFFLFFBQVEsRUFBZ0MsRUFBRSxFQUFFLENBQUMsdURBQXVELGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQztBQUF2TCxRQUFBLGdCQUFnQixvQkFBdUs7QUFDN0wsTUFBTSxXQUFXLEdBQUcsQ0FBQyxFQUFDLFFBQVEsRUFB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