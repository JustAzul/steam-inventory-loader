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
const Worker = (SteamID64, appID, contextID, Config) => {
    const Defaults = {
        Cache: Config.Cache || false,
        Duration: Config.Duration || 15,
        Sqlite: Config.Sqlite || false,
        SteamCommunity_Jar: Config.SteamCommunity_Jar || undefined,
        tradableOnly: Config.tradableOnly || true
    };
    return getInventory_1.default(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Sqlite, Defaults.Cache, Defaults.Duration);
};
const rawLoader = (SteamID64, appID, contextID, Config) => {
    const Defaults = {
        Cache: Config.Cache || false,
        Duration: Config.Duration || 15,
        Sqlite: Config.Sqlite || false,
        SteamCommunity_Jar: Config.SteamCommunity_Jar || undefined,
        tradableOnly: Config.tradableOnly || true
    };
    return getInventory_2.default(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Sqlite, Defaults.Cache, Defaults.Duration);
};
exports.default = {
    Loader: {
        Worker,
        Raw: rawLoader
    },
    getTag: getInventory_2.getTag, getImageURL: getInventory_2.getImageURL, getLargeImageURL: getInventory_2.getLargeImageURL
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseUVBQWlEO0FBQ2pELCtEQUF1RztBQVV2RyxNQUFNLE1BQU0sR0FBRyxDQUFDLFNBQWlCLEVBQUUsS0FBc0IsRUFBRSxTQUEwQixFQUFFLE1BQWMsRUFBa0MsRUFBRTtJQUVySSxNQUFNLFFBQVEsR0FBRztRQUNiLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxJQUFJLEtBQUs7UUFDNUIsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLElBQUksRUFBRTtRQUMvQixNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sSUFBSSxLQUFLO1FBQzlCLGtCQUFrQixFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsSUFBSSxTQUFTO1FBQzFELFlBQVksRUFBRSxNQUFNLENBQUMsWUFBWSxJQUFJLElBQUk7S0FDNUMsQ0FBQztJQUVGLE9BQU8sc0JBQVksQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQzdKLENBQUMsQ0FBQTtBQUVELE1BQU0sU0FBUyxHQUFHLENBQUMsU0FBaUIsRUFBRSxLQUFzQixFQUFFLFNBQTBCLEVBQUUsTUFBYyxFQUFrQyxFQUFFO0lBRXhJLE1BQU0sUUFBUSxHQUFHO1FBQ2IsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLElBQUksS0FBSztRQUM1QixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVEsSUFBSSxFQUFFO1FBQy9CLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxJQUFJLEtBQUs7UUFDOUIsa0JBQWtCLEVBQUUsTUFBTSxDQUFDLGtCQUFrQixJQUFJLFNBQVM7UUFDMUQsWUFBWSxFQUFFLE1BQU0sQ0FBQyxZQUFZLElBQUksSUFBSTtLQUM1QyxDQUFDO0lBRUYsT0FBTyxzQkFBUyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDMUosQ0FBQyxDQUFBO0FBRUQsa0JBQWU7SUFDWCxNQUFNLEVBQUU7UUFDSixNQUFNO1FBQ04sR0FBRyxFQUFFLFNBQVM7S0FDakI7SUFDRCxNQUFNLEVBQU4scUJBQU0sRUFBRSxXQUFXLEVBQVgsMEJBQVcsRUFBRSxnQkFBZ0IsRUFBaEIsK0JBQWdCO0NBQ3hDLENBQUMifQ==