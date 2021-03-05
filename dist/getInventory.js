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
    https: new agentkeepalive_1.default.HttpsAgent(),
};
const got = got_1.default.extend({ agent, timeout: moment_1.duration(50, 'seconds').asMilliseconds() });
const getTag = (tags, category) => {
    if (!tags)
        return null;
    return tags.find((tag) => tag.category === category) || null;
};
exports.getTag = getTag;
const getLargeImageURL = ({ icon_url_large, icon_url }) => `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url_large || icon_url}/`;
exports.getLargeImageURL = getLargeImageURL;
const getImageURL = ({ icon_url }) => `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url}/`;
exports.getImageURL = getImageURL;
const isCardType = (tags) => {
    if (!tags)
        return false;
    try {
        if (exports.getTag(tags, 'item_class')?.internal_name === 'item_class_2') {
            if (exports.getTag(tags, 'cardborder')?.internal_name === 'cardborder_0')
                return 'Normal';
            if (exports.getTag(tags, 'cardborder')?.internal_name === 'cardborder_1')
                return 'Foil';
        }
    }
    catch {
        return false;
    }
    return false;
};
exports.isCardType = isCardType;
function getDescriptionKey(description) {
    return `${description.classid}_${(description.instanceid || '0')}_${description.appid}`;
}
async function getInventory(SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, useCache = true, CacheDuration = 15, useGC = false) {
    if (typeof SteamID64 !== 'string')
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
        Host: 'steamcommunity.com',
    };
    const cookieJar = SteamCommunity_Jar ? CookieParser_1.default(SteamCommunity_Jar._jar.store.idx) : undefined;
    async function Get(inventory, start_assetid) {
        const searchParams = {
            l: 'english',
            count: 5000,
            start_assetid,
        };
        const got_o = {
            url: `https://steamcommunity.com/inventory/${SteamID64}/${appID}/${contextID}`,
            headers,
            searchParams,
            cookieJar,
            throwHttpErrors: false,
        };
        const { statusCode, body } = await got(got_o);
        if (statusCode === 403 && body == 'null')
            throw new Error('This profile is private.');
        if (statusCode === 429)
            throw new Error('rate limited');
        const data = JSON.parse(body);
        if (statusCode === 500 && body && data.error) {
            let newError = new Error(data.error);
            const match = data.error.match(/^(.+) \((\d+)\)$/);
            if (match) {
                newError = new Error(match[1]);
                newError.eresult = match[2];
            }
            throw newError;
        }
        if (!!data?.success && data?.total_inventory_count === 0) {
            const o = {
                success: !!data.success,
                inventory,
                count: data.total_inventory_count ?? 0,
            };
            return o;
        }
        if (!data || !data.success || !data?.assets || !data?.descriptions) {
            if (data)
                throw new Error(data?.error || data?.Error || 'Malformed response');
            throw new Error('Malformed response');
        }
        for (let i = 0; i < data.descriptions.length; i += 1) {
            const Key = getDescriptionKey(data.descriptions[i]);
            if (!Object.prototype.hasOwnProperty.call(DescriptionsCache, Key)) {
                DescriptionsCache[Key] = data.descriptions[i];
            }
        }
        data.descriptions = null;
        for (let i = 0; i < data.assets.length; i += 1) {
            if (!data.assets[i].currencyid) {
                const Key = getDescriptionKey(data.assets[i]);
                if (!tradableOnly || (Object.prototype.hasOwnProperty.call(DescriptionsCache, Key) && DescriptionsCache[Key]?.tradable)) {
                    inventory.push(CEconItem_1.default(data.assets[i], DescriptionsCache[Key], contextID.toString()));
                }
            }
        }
        data.assets = null;
        if (data.more_items)
            return Get(inventory, data.last_assetid);
        const o = {
            success: true,
            inventory,
            count: inventory.length,
        };
        return o;
    }
    const InventoryResult = await Get([], undefined);
    DescriptionsCache = null;
    if (useGC && global?.gc)
        global?.gc();
    if (useCache)
        Database_1.default.SaveCache(CacheKey, InventoryResult);
    return InventoryResult;
}
exports.default = getInventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw4Q0FBdUI7QUFDdkIsb0VBQXVDO0FBQ3ZDLG1DQUFrQztBQUVsQyw0REFFcUI7QUFDckIsa0VBQTBDO0FBQzFDLDBEQUFrQztBQUVsQyxNQUFNLEtBQUssR0FBRztJQUNaLElBQUksRUFBRSxJQUFJLHdCQUFTLEVBQUU7SUFDckIsS0FBSyxFQUFFLElBQUksd0JBQVMsQ0FBQyxVQUFVLEVBQUU7Q0FDbEMsQ0FBQztBQUVGLE1BQU0sR0FBRyxHQUFHLGFBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLGlCQUFRLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQTJCL0UsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFXLEVBQUUsUUFBZ0IsRUFBYyxFQUFFO0lBQ2xFLElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFDdkIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQztBQUMvRCxDQUFDLENBQUM7QUFIVyxRQUFBLE1BQU0sVUFHakI7QUFHSyxNQUFNLGdCQUFnQixHQUFHLENBQUMsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFpQyxFQUFVLEVBQUUsQ0FBQyx1REFBdUQsY0FBYyxJQUFJLFFBQVEsR0FBRyxDQUFDO0FBQWpMLFFBQUEsZ0JBQWdCLG9CQUFpSztBQUV2TCxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFpQyxFQUFVLEVBQUUsQ0FBQyx1REFBdUQsUUFBUSxHQUFHLENBQUM7QUFBMUksUUFBQSxXQUFXLGVBQStIO0FBRWhKLE1BQU0sVUFB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