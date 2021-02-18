"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getInventory_1 = __importDefault(require("./Worker/getInventory"));
const getInventory_2 = __importStar(require("./getInventory"));
const Database_1 = require("./Database");
const Worker = (SteamID64, appID, contextID, Config) => {
    const Defaults = {
        Cache: Config?.Cache || false,
        Duration: Config?.Duration || 15,
        Sqlite: Config?.Sqlite || false,
        SteamCommunity_Jar: Config?.SteamCommunity_Jar || undefined,
        tradableOnly: Config?.tradableOnly || true
    };
    return getInventory_1.default(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Sqlite, Defaults.Cache, Defaults.Duration);
};
const rawLoader = (SteamID64, appID, contextID, Config) => {
    const Defaults = {
        Cache: Config?.Cache || false,
        Duration: Config?.Duration || 15,
        Sqlite: Config?.Sqlite || false,
        SteamCommunity_Jar: Config?.SteamCommunity_Jar || undefined,
        tradableOnly: Config?.tradableOnly || true
    };
    return getInventory_2.default(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Sqlite, Defaults.Cache, Defaults.Duration);
};
exports.default = {
    Loader: {
        Worker,
        Raw: rawLoader
    },
    getTag: getInventory_2.getTag, getImageURL: getInventory_2.getImageURL, getLargeImageURL: getInventory_2.getLargeImageURL, CleanCache: Database_1.CleanCache, isCardType: getInventory_2.isCardType
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseUVBQWlEO0FBQ2pELCtEQUFtSDtBQUNuSCx5Q0FBc0M7QUFVdEMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxTQUFpQixFQUFFLEtBQXNCLEVBQUUsU0FBMEIsRUFBRSxNQUFjLEVBQWtDLEVBQUU7SUFFckksTUFBTSxRQUFRLEdBQUc7UUFDYixLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssSUFBSSxLQUFLO1FBQzdCLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxJQUFJLEVBQUU7UUFDaEMsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLElBQUksS0FBSztRQUMvQixrQkFBa0IsRUFBRSxNQUFNLEVBQUUsa0JBQWtCLElBQUksU0FBUztRQUMzRCxZQUFZLEVBQUUsTUFBTSxFQUFFLFlBQVksSUFBSSxJQUFJO0tBQzdDLENBQUM7SUFFRixPQUFPLHNCQUFZLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM3SixDQUFDLENBQUE7QUFFRCxNQUFNLFNBQVMsR0FBRyxDQUFDLFNBQWlCLEVBQUUsS0FBc0IsRUFBRSxTQUEwQixFQUFFLE1BQWMsRUFBa0MsRUFBRTtJQUV4SSxNQUFNLFFBQVEsR0FBRztRQUNiLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxJQUFJLEtBQUs7UUFDN0IsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLElBQUksRUFBRTtRQUNoQyxNQUFNLEVBQUUsTUFBTSxFQUFFLE1BQU0sSUFBSSxLQUFLO1FBQy9CLGtCQUFrQixFQUFFLE1BQU0sRUFBRSxrQkFBa0IsSUFBSSxTQUFTO1FBQzNELFlBQVksRUFBRSxNQUFNLEVBQUUsWUFBWSxJQUFJLElBQUk7S0FDN0MsQ0FBQztJQUVGLE9BQU8sc0JBQVMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzFKLENBQUMsQ0FBQTtBQUVELGtCQUFlO0lBQ1gsTUFBTSxFQUFFO1FBQ0osTUFBTTtRQUNOLEdBQUcsRUFBRSxTQUFTO0tBQ2pCO0lBQ0QsTUFBTSxFQUFOLHFCQUFNLEVBQUUsV0FBVyxFQUFYLDBCQUFXLEVBQUUsZ0JBQWdCLEVBQWhCLCtCQUFnQixFQUFFLFVBQVUsRUFBVixxQkFBVSxFQUFFLFVBQVUsRUFBVix5QkFBVTtDQUNoRSxDQUFDIn0=