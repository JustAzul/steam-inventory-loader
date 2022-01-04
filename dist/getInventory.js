"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCardType = exports.getImageURL = exports.getLargeImageURL = exports.getTag = void 0;
const moment_1 = require("moment");
const events_1 = __importDefault(require("events"));
const CEconItem_1 = __importDefault(require("./CEconItem"));
const got_1 = __importDefault(require("./got"));
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
async function getInventory(SteamID64, appID, contextID, tradableOnly = true, SteamCommunity_Jar, Language) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0SW52ZW50b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dldEludmVudG9yeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7QUFHQSxtQ0FBa0M7QUFFbEMsb0RBQWtDO0FBRWxDLDREQUVxQjtBQUVyQixnREFBd0I7QUErQmpCLE1BQU0sTUFBTSxHQUFHLENBQUMsSUFBVyxFQUFFLFFBQWdCLEVBQWMsRUFBRTtJQUNsRSxJQUFJLENBQUMsSUFBSTtRQUFFLE9BQU8sSUFBSSxDQUFDO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUM7QUFDL0QsQ0FBQyxDQUFDO0FBSFcsUUFBQSxNQUFNLFVBR2pCO0FBR0ssTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBaUMsRUFBVSxFQUFFLENBQUMsdURBQXVELGNBQWMsSUFBSSxRQUFRLEdBQUcsQ0FBQztBQUFqTCxRQUFBLGdCQUFnQixvQkFBaUs7QUFFdkwsTUFBTSxXQUFXLEdBQUcsQ0FBQyxFQUFFLFFBQVEsRUFBaUMsRUFBVSxFQUFFLENBQUMsdURBQXVELFFBQVEsR0FBRyxDQUFDO0FBQTFJLFFBQUEsV0FBVyxlQUErSDtBQUVoSixNQUFNLFVBQVUsR0FBRyxDQUFDLElBQVcsRUFBd0MsRUFBRTtJQUM5RSxJQUFJLENBQUMsSUFBSTtRQUFFLE9BQU8sS0FBSyxDQUFDO0lBRXhCLElBQUk7UUFDRixJQUFJLElBQUEsY0FBTSxFQUFDLElBQUksRUFBRSxZQUFZLENBQUMsRUFBRSxhQUFhLEtBQUssY0FBYyxFQUFFO1lBQ2hFLElBQUksSUFBQSxjQUFNLEVBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxFQUFFLGFBQWEsS0FBSyxjQUFjO2dCQUFFLE9BQU8sUUFBUSxDQUFDO1lBQ2xGLElBQUksSUFBQSxjQUFN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