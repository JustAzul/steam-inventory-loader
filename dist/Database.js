"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDescription = exports.saveDescription = exports.SaveCache = exports.GetCache = exports.CleanCache = exports.InitCache = exports.InitDescriptions = void 0;
const fs_1 = require("fs");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const moment_1 = __importDefault(require("moment"));
const Paths = {
    Descriptions: path_1.default.join(__dirname, './descriptions.db'),
    Cache: path_1.default.join(__dirname, './cache.db')
};
const DB = {
    Descriptions: new better_sqlite3_1.default(Paths.Descriptions),
    Cache: new better_sqlite3_1.default(Paths.Cache)
};
const InitDescriptions = () => {
    const SQL = fs_1.readFileSync(path_1.default.resolve(__dirname, "../", "./sql/Descriptions.sql"), "utf-8");
    DB.Descriptions.exec(SQL);
};
exports.InitDescriptions = InitDescriptions;
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
const saveDescription = (Key, Value) => {
    const Insert = DB.Descriptions.prepare(`INSERT OR IGNORE INTO descriptions(id, value) VALUES(?, ?)`);
    Insert.run(Key, Buffer.from(JSON.stringify(Value)));
};
exports.saveDescription = saveDescription;
const getDescription = (Key) => {
    const Select = DB.Descriptions.prepare(`SELECT value FROM descriptions where id = ?`);
    const Result = Select.get(Key) || null;
    if (Result?.value)
        return JSON.parse(Result.value.toString());
    return null;
};
exports.getDescription = getDescription;
exports.default = {
    InitDescriptions: exports.InitDescriptions, saveDescription: exports.saveDescription, getDescription: exports.getDescription, InitCache: exports.InitCache, GetCache: exports.GetCache, SaveCache: exports.SaveCache
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGF0YWJhc2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvRGF0YWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMkJBQWdDO0FBQ2hDLG9FQUFzQztBQUN0QyxnREFBd0I7QUFDeEIsb0RBQTRCO0FBRTVCLE1BQU0sS0FBSyxHQUFHO0lBQ1YsWUFBWSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDO0lBQ3ZELEtBQUssRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUM7Q0FDNUMsQ0FBQTtBQUVELE1BQU0sRUFBRSxHQUFHO0lBQ1AsWUFBWSxFQUFFLElBQUksd0JBQVEsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBQzlDLEtBQUssRUFBRSxJQUFJLHdCQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztDQUNuQyxDQUFBO0FBRU0sTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLEVBQUU7SUFDakMsTUFBTSxHQUFHLEdBQUcsaUJBQVksQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsd0JBQXdCLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUM1RixFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5QixDQUFDLENBQUM7QUFIVyxRQUFBLGdCQUFnQixvQkFHM0I7QUFFSyxNQUFNLFNBQVMsR0FBRyxHQUFHLEVBQUU7SUFDMUIsTUFBTSxHQUFHLEdBQUcsaUJBQVksQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsaUJBQWlCLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNyRixFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2QixDQUFDLENBQUM7QUFIVyxRQUFBLFNBQVMsYUFHcEI7QUFFSyxNQUFN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