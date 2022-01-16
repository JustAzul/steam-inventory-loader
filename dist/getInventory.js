"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCardType = exports.getImageURL = exports.getLargeImageURL = exports.getTag = void 0;
const moment_1 = require("moment");
const events_1 = __importDefault(require("events"));
const got_1 = __importDefault(require("got"));
const CEconItem_1 = __importDefault(require("./CEconItem"));
const getAgent_1 = __importDefault(require("./getAgent"));
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
        if ((0, exports.getTag)(tags, 'item_class')?.internal_name === 'item_class_2') {
            if ((0, exports.getTag)(tags, 'cardborder')?.internal_name === 'cardborder_0')
                return 'Normal';
            if ((0, exports.getTag)(tags, 'cardborder')?.internal_name === 'cardborder_1')
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
async function getInventory(SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, Language, useProxy, proxyAddress) {
    if (typeof SteamID64 !== 'string')
        SteamID64 = SteamID64.getSteamID64();
    const headers = {
        Referer: `https://steamcommunity.com/profiles/${SteamID64}/inventory`,
        Host: 'steamcommunity.com',
    };
    let DescriptionsCache = {};
    const inventory = [];
    let GcPages = 0;
    const Event = new events_1.default();
    const GetDescription = (Key) => DescriptionsCache[Key] || undefined;
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
            cookieJar: SteamCommunity_Jar,
            throwHttpErrors: false,
            timeout: (0, moment_1.duration)(25, 'seconds').asMilliseconds(),
            agent: {
                https: (0, getAgent_1.default)(useProxy ? proxyAddress : 'false'),
            },
        };
        let { statusCode, body } = await (0, got_1.default)(GotOptions);
        if (statusCode === 403 && body == 'null') {
            Event.emit('error', new Error('This profile is private.'));
            return;
        }
        if (statusCode === 429) {
            Event.emit('error', new Error('rate limited'));
            return;
        }
        const FetchRetry = () => setTimeout(() => Fetch(StartAssetID, (Retries + 1)), (0, moment_1.duration)(1, 'second').asMilliseconds());
        let data;
        try {
            data = JSON.parse(body);
        }
        catch {
            if (Retries < 3) {
                FetchRetry();
                return;
            }
            Event.emit('error', new Error('Malformed response'));
            return;
        }
        if (statusCode !== 200) {
            if (body && !!data?.error) {
                let newError = new Error(data.error);
                const match = data.error.match(/^(.+) \((\d+)\)$/);
                if (match) {
                    newError = new Error(match[1]);
                    newError.eresult = match[2];
                }
                Event.emit('error', newError);
                return;
            }
            if (Retries < 3) {
                FetchRetry();
                return;
            }
            Event.emit('error', new Error('Bad statusCode'));
            return;
        }
        if (!!data?.success && data?.total_inventory_count === 0) {
            const o = {
                success: !!data.success,
                inventory: [],
                count: data.total_inventory_count ?? 0,
            };
            Event.emit('done', o);
            return;
        }
        if (!data || !data?.success || !data?.assets || !data?.descriptions) {
            if (Retries < 3) {
                FetchRetry();
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
            process.nextTick(() => { data = null; });
            if (global.gc) {
                GcPages += 1;
                if (GcPages > 3) {
                    global.gc();
                    GcPages = 0;
                }
            }
            Fetch(LastAssetID, 0);
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
                                const Item = await (0, CEconItem_1.default)(Asset, Description, contextID.toString());
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
            process.nextTick(() => {
                DescriptionsCache = null;
                if (global.gc)
                    global.gc();
            });
        });
        Event.once('error', (error) => {
            RemoveListeners();
            reject(error);
        });
    });
}
exports.default = getInventory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHQSxtQ0FBa0M7QUFFbEMsb0RBQWtDO0FBRWxDLDhDQUFzQjtBQUN0Qiw0REFFcUI7QUFDckIsMERBQWtDO0FBK0IzQixNQUFNLE1BQU0sR0FBRyxDQUFDLElBQVcsRUFBRSxRQUFnQixFQUFjLEVBQUU7SUFDbEUsSUFBSSxDQUFDLElBQUk7UUFBRSxPQUFPLElBQUksQ0FBQztJQUN2QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDO0FBQy9ELENBQUMsQ0FBQztBQUhXLFFBQUEsTUFBTSxVQUdqQjtBQUdLLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQWlDLEVBQVUsRUFBRSxDQUFDLHVEQUF1RCxjQUFjLElBQUksUUFBUSxHQUFHLENBQUM7QUFBakwsUUFBQSxnQkFBZ0Isb0JBQWlLO0FBRXZMLE1BQU0sV0FBVyxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQWlDLEVBQVUsRUFBRSxDQUFDLHVEQUF1RCxRQUFRLEdBQUcsQ0FBQztBQUExSSxRQUFBLFdBQVcsZUFBK0g7QUFFaEosTUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFXLEVBQXdDLEVBQUU7SUFDOUUsSUFBSSxDQUFDLElBQUk7UUFBRSxPQUFPLEtBQUssQ0FBQztJQUV4QixJQUFJO1FBQ0YsSUFBSSxJQUFBLGNBQU0sRUFBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLEVBQUUsYUFBYSxLQUFLLGNBQWMsRUFBRTtZQUNoRSxJQUFJLElBQUEsY0FBTSxFQUFDLElBQUksRUFBRSxZQUFZLENBQUMsRUFBRSxhQUFhLEtBQUssY0FBYztnQkFBRSxPQUFPLFFBQVEsQ0FBQztZQUNsRixJ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