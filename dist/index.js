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
Object.defineProperty(exports, "__esModule", { value: true });
const getInventory_1 = __importStar(require("./getInventory"));
const Database_1 = require("./Database");
const Loader = (SteamID64, appID, contextID, LoaderConfig) => {
    const Defaults = {
        Cache: LoaderConfig?.Cache ?? false,
        Duration: LoaderConfig?.Duration ?? 15,
        SteamCommunity_Jar: LoaderConfig?.SteamCommunity_Jar || undefined,
        tradableOnly: LoaderConfig?.tradableOnly ?? true,
        enableGC: LoaderConfig?.enableGC ?? false,
    };
    return getInventory_1.default(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Cache, Defaults.Duration, Defaults.enableGC);
};
exports.default = {
    Loader, getTag: getInventory_1.getTag, getImageURL: getInventory_1.getImageURL, getLargeImageURL: getInventory_1.getLargeImageURL, CleanCache: Database_1.CleanCache, isCardType: getInventory_1.isCardType,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0RBRXdCO0FBQ3hCLHlDQUF3QztBQVd4QyxNQUFNLE1BQU0sR0FBRyxDQUFDLFNBQWlCLEVBQUUsS0FBc0IsRUFBRSxTQUEwQixFQUFFLFlBQW9CLEVBQWtDLEVBQUU7SUFDN0ksTUFBTSxRQUFRLEdBQUc7UUFDZixLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssSUFBSSxLQUFLO1FBQ25DLFFBQVEsRUFBRSxZQUFZLEVBQUUsUUFBUSxJQUFJLEVBQUU7UUFDdEMsa0JBQWtCLEVBQUUsWUFBWSxFQUFFLGtCQUFrQixJQUFJLFNBQVM7UUFDakUsWUFBWSxFQUFFLFlBQVksRUFBRSxZQUFZLElBQUksSUFBSTtRQUNoRCxRQUFRLEVBQUUsWUFBWSxFQUFFLFFBQVEsSUFBSSxLQUFLO0tBQzFDLENBQUM7SUFFRixPQUFPLHNCQUFTLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsa0JBQWtCLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMxSixDQUFDLENBQUM7QUFFRixrQkFBZTtJQUNiLE1BQU0sRUFBRSxNQUFNLEVBQU4scUJBQU0sRUFBRSxXQUFXLEVBQVgsMEJBQVcsRUFBRSxnQkFBZ0IsRUFBaEIsK0JBQWdCLEVBQUUsVUFBVSxFQUFWLHFCQUFVLEVBQUUsVUFBVSxFQUFWLHlCQUFVO0NBQ3RFLENBQUMifQ==