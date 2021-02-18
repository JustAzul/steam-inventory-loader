import {readFileSync} from 'fs';
import Database from 'better-sqlite3';
import Path from 'path';
import moment from 'moment';

const Paths = {
    Descriptions: Path.join(__dirname, './descriptions.db'),
    Cache: Path.join(__dirname, './cache.db')
}

const DB = {
    Descriptions: new Database(Paths.Descriptions),
    Cache: new Database(Paths.Cache)
}

export const InitDescriptions = () => {
    const SQL = readFileSync(Path.resolve(__dirname, "../", "./sql/Descriptions.sql"), "utf-8");
    DB.Descriptions.exec(SQL);
};

export const InitCache = () => {
    const SQL = readFileSync(Path.resolve(__dirname, "../", "./sql/Cache.sql"), "utf-8");
    DB.Cache.exec(SQL);
};

export const CleanCache = (MaxDuration: number) => {
    const Delete = DB.Cache.prepare(`DELETE FROM inventory_cache WHERE updated >= ?`);
    Delete.run(moment().subtract(MaxDuration, 'seconds').toISOString());
}

export const GetCache = (Key: string, Seconds: number = 5) => {
    const Select = DB.Cache.prepare(`SELECT contents FROM inventory_cache WHERE id = ? AND updated >= ?`);
    const Result: any = Select.get(Key, moment().subtract(Seconds, 'seconds').toISOString());

    if (Result?.contents) return JSON.parse(Result.contents.toString());

    return null;
}

export const SaveCache = (Key: string, contents: any) => {
    const Insert = DB.Cache.prepare(`INSERT OR REPLACE INTO inventory_cache(id, contents, updated) VALUES (?, ?, ?)`);
    Insert.run(Key, Buffer.from(JSON.stringify(contents)), new Date().toISOString());
}

export const saveDescription = (Key: string, Value: object) => {
    const Insert = DB.Descriptions.prepare(`INSERT OR IGNORE INTO descriptions(id, value) VALUES(?, ?)`);
    Insert.run(Key, Buffer.from(JSON.stringify(Value)));
}

interface DescriptionResult {
    value?: Buffer
}

export const getDescription = (Key: string) => {
    const Select = DB.Descriptions.prepare(`SELECT value FROM descriptions where id = ?`);
    const Result: DescriptionResult | null = Select.get(Key) || null;
    if (Result?.value) return JSON.parse(Result.value.toString());
    return null;
}

export default {
    InitDescriptions, saveDescription, getDescription, InitCache, GetCache, SaveCache
}