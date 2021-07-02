"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const got_1 = __importDefault(require("got"));
const moment_1 = require("moment");
const agentkeepalive_1 = __importDefault(require("agentkeepalive"));
const agent = {
    http: new agentkeepalive_1.default(),
    https: new agentkeepalive_1.default.HttpsAgent(),
};
const Options = {
    agent,
    timeout: moment_1.duration(50, 'seconds').asMilliseconds(),
};
const ExtendedGot = got_1.default.extend(Options);
exports.default = ExtendedGot;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ290LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2dvdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDhDQUFzQjtBQUN0QixtQ0FBa0M7QUFDbEMsb0VBQXdDO0FBRXhDLE1BQU0sS0FBSyxHQUFHO0lBQ1osSUFBSSxFQUFFLElBQUksd0JBQVUsRUFBRTtJQUN0QixLQUFLLEVBQUUsSUFBSSx3QkFBVSxDQUFDLFVBQVUsRUFBRTtDQUNuQyxDQUFDO0FBRUYsTUFBTSxPQUFPLEdBQUc7SUFDZCxLQUFLO0lBQ0wsT0FBTyxFQUFFLGlCQUFRLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxDQUFDLGNBQWMsRUFBRTtDQUNsRCxDQUFDO0FBRUYsTUFBTSxXQUFXLEdBQUcsYUFBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUV4QyxrQkFBZSxXQUFXLENBQUMifQ==