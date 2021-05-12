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
const Loader = (SteamID64, appID, contextID, LoaderConfig) => {
    const Defaults = {
        SteamCommunity_Jar: LoaderConfig?.SteamCommunity_Jar || undefined,
        tradableOnly: LoaderConfig?.tradableOnly ?? true,
        Language: LoaderConfig?.Language ?? 'english',
    };
    return getInventory_1.default(SteamID64, appID, contextID, Defaults.tradableOnly, Defaults.SteamCommunity_Jar, Defaults.Language);
};
exports.default = {
    Loader, getTag: getInventory_1.getTag, getImageURL: getInventory_1.getImageURL, getLargeImageURL: getInventory_1.getLargeImageURL, isCardType: getInventory_1.isCardType,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0RBRXdCO0FBU3hCLE1BQU0sTUFBTSxHQUFHLENBQUMsU0FBaUIsRUFBRSxLQUFzQixFQUFFLFNBQTBCLEVBQUUsWUFBb0IsRUFBa0MsRUFBRTtJQUM3SSxNQUFNLFFBQVEsR0FBRztRQUNmLGtCQUFrQixFQUFFLFlBQVksRUFBRSxrQkFBa0IsSUFBSSxTQUFTO1FBQ2pFLFlBQVksRUFBRSxZQUFZLEVBQUUsWUFBWSxJQUFJLElBQUk7UUFDaEQsUUFBUSxFQUFFLFlBQVksRUFBRSxRQUFRLElBQUksU0FBUztLQUM5QyxDQUFDO0lBRUYsT0FBTyxzQkFBUyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2SCxDQUFDLENBQUM7QUFFRixrQkFBZTtJQUNiLE1BQU0sRUFBRSxNQUFNLEVBQU4scUJBQU0sRUFBRSxXQUFXLEVBQVgsMEJBQVcsRUFBRSxnQkFBZ0IsRUFBaEIsK0JBQWdCLEVBQUUsVUFBVSxFQUFWLHlCQUFVO0NBQzFELENBQUMifQ==