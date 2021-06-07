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
    const cookieJar = SteamCommunity_Jar ? (await CookieParser_1.default(SteamCommunity_Jar._jar.store.idx)) : undefined;
    let DescriptionsCache = {};
    const inventory = [];
    const GetDescription = (Key) => DescriptionsCache[Key] || undefined;
    let GcPages = 0;
    const Event = new events_1.default();
    const RemoveListeners = () => {
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
            {
                const Iterate = () => new Promise((Resolve) => {
                    const Execute = (i = 0) => {
                        if (i === Descriptions.length) {
                            Resolve();
                            return;
                        }
                        const Description = Descriptions[i];
                        const Key = getDescriptionKey(Description);
                        if (!Object.prototype.hasOwnProperty.call(DescriptionsCache, Key))
                            DescriptionsCache[Key] = Description;
                        setImmediate(Execute.bind(null, i + 1));
                    };
                    Execute();
                });
                await Iterate();
            }
            {
                const Iterate = () => new Promise((Resolve) => {
                    const Execute = async (i = 0) => {
                        if (i === Assets.length) {
                            Resolve();
                            return;
                        }
                        const Asset = Assets[i];
                        if (!Asset.currencyid) {
                            const Key = getDescriptionKey(Asset);
                            const Description = GetDescription(Key);
                            if (!tradableOnly || (Description && Description.tradable)) {
                                const Item = await CEconItem_1.default(Asset, Description, contextID.toString());
                                inventory.push(Item);
                            }
                        }
                        setImmediate(Execute.bind(null, i + 1));
                    };
                    Execute();
                });
                await Iterate();
            }
            PagesDone += 1;
        });
        Event.once('FetchDone', async () => {
            {
                const Check = () => new Promise((SetJobDone) => {
                    const Execute = () => {
                        if (TotalPages === PagesDone)
                            SetJobDone();
                        else
                            setTimeout(Execute, 100);
                    };
                    Execute();
                });
                await Check();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFFQSw4Q0FBdUI7QUFDdkIsb0VBQXVDO0FBQ3ZDLG1DQUFrQztBQUVsQyxvREFBa0M7QUFDbEMsNERBRXFCO0FBQ3JCLGtFQUEwQztBQUUxQyxNQUFNLEtBQUssR0FBRztJQUNaLElBQUksRUFBRSxJQUFJLHdCQUFTLEVBQUU7SUFDckIsS0FBSyxFQUFFLElBQUksd0JBQVMsQ0FBQyxVQUFVLEVBQUU7Q0FDbEMsQ0FBQztBQUVGLE1BQU0sR0FBRyxHQUFHLGFBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLGlCQUFRLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQTJCL0UsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFXLEVBQUUsUUFBZ0IsRUFBYyxFQUFFO0lBQ2xFLElBQUksQ0FBQyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFDdkIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQztBQUMvRCxDQUFDLENBQUM7QUFIVyxRQUFBLE1BQU0sVUFHakI7QUFHSyxNQUFNLGdCQUFnQixHQUFHLENBQUMsRUFBRSxjQUFjLEVBQUUsUUFBUSxFQUFpQyxFQUFVLEVBQUUsQ0FBQyx1REFBdUQsY0FBYyxJQUFJLFFBQVEsR0FBRyxDQUFDO0FBQWpMLFFBQUEsZ0JBQWdCLG9CQUFpSztBQUV2TCxNQUFNLFdBQVcsR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFpQyxFQUFVLEVBQUUsQ0FBQyx1REFBdUQsUUFBUSxHQUFHLENBQUM7QUFBMUksUUFBQSxXQUFXLGVBQStIO0FBRWhKLE1BQU0sVUFB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