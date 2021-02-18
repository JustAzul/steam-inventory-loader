"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveCache = exports.GetCache = exports.CleanCache = exports.InitCache = void 0;
const fs_1 = require("fs");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const Paths = {
    Cache: path_1.default.join(__dirname, './cache.db')
};
const DB = {
    Cache: new better_sqlite3_1.default(Paths.Cache)
};
const InitCache = () => {
    const SQL = fs_1.readFileSync(path_1.default.resolve(__dirname, "../", "./sql/Cache.sql"), "utf-8");
    DB.Cache.exec(SQL);
};
exports.InitCache = InitCache;
const CleanCache = (MaxDuration) => {
    const Delete = DB.Cache.prepare(`DELETE FROM inventory_cache WHERE updated >= ?`);
    Delete.run(moment_1.default().subtract(MaxDuration, 'seconds').toISOString());
};
exports.CleanCache = CleanCache;
const GetCache = (Key, Seconds = 5) => {
    const Select = DB.Cache.prepare(`SELECT contents FROM inventory_cache WHERE id = ? AND updated >= ?`);
    const Result = Select.get(Key, moment_1.default().subtract(Seconds, 'seconds').toISOString());
    if (Result?.contents)
        return JSON.parse(Result.contents.toString());
    return null;
};
exports.GetCache = GetCache;
const SaveCache = (Key, contents) => {
    const Insert = DB.Cache.prepare(`INSERT OR REPLACE INTO inventory_cache(id, contents, updated) VALUES (?, ?, ?)`);
    Insert.run(Key, Buffer.from(JSON.stringify(contents)), new Date().toISOString());
};
exports.SaveCache = SaveCache;
exports.default = {
    InitCache: exports.InitCache, GetCache: exports.GetCache, SaveCache: exports.SaveCache
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvRGF0YWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMkJBQWdDO0FBQ2hDLG9FQUFzQztBQUN0QyxnREFBd0I7QUFDeEIsb0RBQTRCO0FBRTVCLE1BQU0sS0FBSyxHQUFHO0lBQ1YsS0FBSyxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQztDQUM1QyxDQUFDO0FBRUYsTUFBTSxFQUFFLEdBQUc7SUFDUCxLQUFLLEVBQUUsSUFBSSx3QkFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7Q0FDbkMsQ0FBQztBQUVLLE1BQU0sU0FBUyxHQUFHLEdBQUcsRUFBRTtJQUMxQixNQUFNLEdBQUcsR0FBRyxpQkFBWSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JGLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLENBQUMsQ0FBQztBQUhXLFFBQUEsU0FBUyxhQUdwQjtBQUVLLE1BQU0sVUFBVSxHQUFHLENBQUMsV0FBbUIsRUFBRSxFQUFFO0lBQzlDLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7SUFDbEYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ3hFLENBQUMsQ0FBQTtBQUhZLFFBQUEsVUFBVSxjQUd0QjtBQUVNLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBVyxFQUFFLFVBQWtCLENBQUMsRUFBRSxFQUFFO0lBQ3pELE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLG9FQUFvRSxDQUFDLENBQUM7SUFDdEcsTUFBTSxNQUFNLEdBQVEsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsZ0JBQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUV6RixJQUFJLE1BQU0sRUFBRSxRQUFRO1FBQUUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUVwRSxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFDLENBQUE7QUFQWSxRQUFBLFFBQVEsWUFPcEI7QUFFTSxNQUFNLFNBQVMsR0FBRyxDQUFDLEdBQVcsRUFBRSxRQUFhLEVBQUUsRUFBRTtJQUNwRCxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnRkFBZ0YsQ0FBQyxDQUFDO0lBQ2xILE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUNyRixDQUFDLENBQUE7QUFIWSxRQUFBLFNBQVMsYUFHckI7QUFFRCxrQkFBZTtJQUNYLFNBQVMsRUFBVCxpQkFBUyxFQUFFLFFBQVEsRUFBUixnQkFBUSxFQUFFLFNBQVMsRUFBVCxpQkFBUztDQUNqQyxDQUFBIn0=