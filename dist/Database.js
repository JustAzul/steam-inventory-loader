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
    Cache: path_1.default.join(__dirname, './cache.db'),
};
const DB = {
    Cache: new better_sqlite3_1.default(Paths.Cache),
};
const InitCache = () => {
    const SQL = fs_1.readFileSync(path_1.default.resolve(__dirname, '../', './sql/Cache.sql'), 'utf-8');
    DB.Cache.exec(SQL);
};
exports.InitCache = InitCache;
const CleanCache = (MaxDuration) => {
    const Delete = DB.Cache.prepare('DELETE FROM inventory_cache WHERE updated >= ?');
    Delete.run(moment_1.default().subtract(MaxDuration, 'seconds').toISOString());
};
exports.CleanCache = CleanCache;
const GetCache = (Key, Seconds = 5) => {
    const Select = DB.Cache.prepare('SELECT contents FROM inventory_cache WHERE id = ? AND updated >= ?');
    const Result = Select.get(Key, moment_1.default().subtract(Seconds, 'seconds').toISOString());
    if (Result?.contents)
        return JSON.parse(Result.contents.toString());
    return undefined;
};
exports.GetCache = GetCache;
const SaveCache = (Key, contents) => {
    const Insert = DB.Cache.prepare('INSERT OR REPLACE INTO inventory_cache(id, contents, updated) VALUES (?, ?, ?)');
    Insert.run(Key, Buffer.from(JSON.stringify(contents)), new Date().toISOString());
};
exports.SaveCache = SaveCache;
exports.default = {
    InitCache: exports.InitCache, GetCache: exports.GetCache, SaveCache: exports.SaveCache,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvRGF0YWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMkJBQWtDO0FBQ2xDLG9FQUFzQztBQUN0QyxnREFBd0I7QUFDeEIsb0RBQTRCO0FBRzVCLE1BQU0sS0FBSyxHQUFHO0lBQ1osS0FBSyxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQztDQUMxQyxDQUFDO0FBRUYsTUFBTSxFQUFFLEdBQUc7SUFDVCxLQUFLLEVBQUUsSUFBSSx3QkFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7Q0FDakMsQ0FBQztBQUVLLE1BQU0sU0FBUyxHQUFHLEdBQVMsRUFBRTtJQUNsQyxNQUFNLEdBQUcsR0FBRyxpQkFBWSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JGLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQztBQUhXLFFBQUEsU0FBUyxhQUdwQjtBQUVLLE1BQU0sVUFBVSxHQUFHLENBQUMsV0FBbUIsRUFBUSxFQUFFO0lBQ3RELE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7SUFDbEYsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQ3RFLENBQUMsQ0FBQztBQUhXLFFBQUEsVUFBVSxjQUdyQjtBQUVLLE1BQU0sUUFBUSxHQUFHLENBQUMsR0FBVyxFQUFFLE9BQU8sR0FBRyxDQUFDLEVBQXFDLEVBQUU7SUFDdEYsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsb0VBQW9FLENBQUMsQ0FBQztJQUN0RyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxnQkFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQ3BGLElBQUksTUFBTSxFQUFFLFFBQVE7UUFBRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ3BFLE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMsQ0FBQztBQUxXLFFBQUEsUUFBUSxZQUtuQjtBQUVLLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBVyxFQUFFLFFBQStCLEVBQVEsRUFBRTtJQUM5RSxNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxnRkFBZ0YsQ0FBQyxDQUFDO0lBQ2xILE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUNuRixDQUFDLENBQUM7QUFIVyxRQUFBLFNBQVMsYUFHcEI7QUFFRixrQkFBZTtJQUNiLFNBQVMsRUFBVCxpQkFBUyxFQUFFLFFBQVEsRUFBUixnQkFBUSxFQUFFLFNBQVMsRUFBVCxpQkFBUztDQUMvQixDQUFDIn0=