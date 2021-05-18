"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCardType = exports.getImageURL = exports.getLargeImageURL = exports.getTag = void 0;
const got_1 = __importDefault(require("got"));
const agentkeepalive_1 = __importDefault(require("agentkeepalive"));
const moment_1 = require("moment");
const events_1 = __importDefault(require("events"));
const CEconItem_1 = __importDefault(require("./CEconItem"));
const CookieParser_1 = __importDefault(require("./CookieParser"));
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
async function getInventory(SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, Language) {
    if (typeof SteamID64 !== 'string')
        SteamID64 = SteamID64.getSteamID64();
    const headers = {
        Referer: `https://steamcommunity.com/profiles/${SteamID64}/inventory`,
        Host: 'steamcommunity.com',
    };
    const cookieJar = SteamCommunity_Jar ? CookieParser_1.default(SteamCommunity_Jar._jar.store.idx) : undefined;
    let DescriptionsCache = {};
    const inventory = [];
    const GetDescription = (Key) => DescriptionsCache[Key] || undefined;
    let GcPages = 0;
    const Event = new events_1.default();
    const RemoveListeners = async () => {
        Event.removeAllListeners('FetchDone');
        Event.removeAllListeners('data');
        Event.removeAllListeners('done');
        Event.removeAllListeners('error');
    };
    async function Fetch(StartAssetID, Retries) {
        const searchParams = {
            l: Language,
            count: 5000,
            start_assetid: StartAssetID,
        };
        const GotOptions = {
            url: `https://steamcommunity.com/inventory/${SteamID64}/${appID}/${contextID}`,
            headers,
            searchParams,
            cookieJar,
            throwHttpErrors: false,
        };
        let { statusCode, body } = await got(GotOptions);
        if (statusCode === 403 && body == 'null') {
            Event.emit('error', new Error('This profile is private.'));
            return;
        }
        if (statusCode === 429) {
            Event.emit('error', new Error('rate limited'));
            return;
        }
        let data;
        try {
            data = JSON.parse(body);
        }
        catch {
            if (Retries < 3) {
                setTimeout(() => Fetch(StartAssetID, (Retries + 1)), moment_1.duration(1, 'second').asMilliseconds());
                return;
            }
            Event.emit('error', new Error('Malformed response'));
            return;
        }
        if (statusCode === 500 && body && data.error) {
            let newError = new Error(data.error);
            const match = data.error.match(/^(.+) \((\d+)\)$/);
            if (match) {
                newError = new Error(match[1]);
                newError.eresult = match[2];
            }
            Event.emit('error', newError);
            return;
        }
        body = null;
        if (!!data?.success && data?.total_inventory_count === 0) {
            const o = {
                success: !!data.success,
                inventory: [],
                count: data.total_inventory_count ?? 0,
            };
            Event.emit('done', o);
            return;
        }
        if (!data || !data.success || !data?.assets || !data?.descriptions) {
            if (Retries < 3) {
                setTimeout(() => Fetch(StartAssetID, (Retries + 1)), moment_1.duration(1, 'second').asMilliseconds());
                return;
            }
            if (data) {
                Event.emit('error', new Error(data?.error || data?.Error || 'Malformed response'));
                return;
            }
            Event.emit('error', new Error('Malformed response'));
            return;
        }
        Event.emit('data', data.descriptions, data.assets);
        if (data.more_items) {
            const { LastAssetID } = { LastAssetID: data.last_assetid };
            data = null;
            if (global.gc) {
                GcPages += 1;
                if (GcPages > 3) {
                    global.gc();
                    GcPages = 0;
                }
            }
            Fetch(LastAssetID, Retries);
        }
        else
            Event.emit('FetchDone');
    }
    Fetch(undefined, 0);
    return new Promise((resolve, reject) => {
        let TotalPages = 0;
        let PagesDone = 0;
        Event.on('data', async (Descriptions, Assets) => {
            TotalPages += 1;
            for (let i = 0; i < Descriptions.length; i += 1) {
                const Description = Descriptions[i];
                const Key = getDescriptionKey(Description);
                if (!Object.prototype.hasOwnProperty.call(DescriptionsCache, Key))
                    DescriptionsCache[Key] = Description;
            }
            for (let i = 0; i < Assets.length; i += 1) {
                const Asset = Assets[i];
                if (!Asset.currencyid) {
                    const Key = getDescriptionKey(Asset);
                    const Description = GetDescription(Key);
                    if (!tradableOnly || (Description && Description.tradable)) {
                        const Item = CEconItem_1.default(Asset, Description, contextID.toString());
                        inventory.push(Item);
                    }
                }
            }
            PagesDone += 1;
        });
        Event.once('FetchDone', async () => {
            while (TotalPages !== PagesDone) {
            }
            const o = {
                success: true,
                inventory,
                count: inventory.length,
            };
            Event.emit('done', o);
        });
        Event.once('done', async (Result) => {
            resolve(Result);
            RemoveListeners();
            DescriptionsCache = null;
            if (global.gc)
                global.gc();
        });
        Event.once('error', (error) => {
            RemoveListeners();
            reject(error);
        });
    });
}
exports.default = getInventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFDQSw4Q0FBdUI7QUFDdkIsb0VBQXVDO0FBQ3ZDLG1DQUFrQztBQUVsQyxvREFBa0M7QUFDbEMsNERBRXFCO0FBQ3JCLGtFQUEwQztBQUUxQyxNQUFNLEtBQUssR0FBRztJQUNaLElBQUksRUFBRSxJQUFJLHdCQUFTLEVBQUU7SUFDckIsS0FBSyxFQUFFLElBQUksd0JBQVMsQ0FBQyxVQUFVLEVBQUU7Q0FDbEMsQ0FBQztBQUVGLE1BQU0sR0FBRyxHQUFHLGFBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLGlCQUFRLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQTJCL0UsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFXLEVBQUUsUUFBZ0IsRUFBYyxFQUFFO0lBQ2xFLElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFDdkIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQztBQUMvRCxDQUFDLENBQUM7QUFIVyxRQUFBLE1BQU0sVUFHakI7QUFHSyxNQUFNLGdCQUFnQixHQUFHLENBQUMsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFpQyxFQUFVLEVBQUUsQ0FBQyx1REFBdUQsY0FBYyxJQUFJLFFBQVEsR0FBRyxDQUFDO0FBQWpMLFFBQUEsZ0JBQWdCLG9CQUFpSztBQUV2TCxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFpQyxFQUFVLEVBQUUsQ0FBQyx1REFBdUQsUUFBUSxHQUFHLENBQUM7QUFBMUksUUFBQSxXQUFXLGVBQStIO0FBRWhKLE1BQU0sVUFB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