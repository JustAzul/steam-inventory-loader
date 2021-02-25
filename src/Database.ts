import { readFileSync } from 'fs';
import Database from 'better-sqlite3';
import Path from 'path';
import moment from 'moment';
import { AzulInventoryResponse } from './getInventory';

const Paths = {
  Cache: Path.join(__dirname, './cache.db'),
};

const DB = {
  Cache: new Database(Paths.Cache),
};

export const InitCache = (): void => {
  const SQL = readFileSync(Path.resolve(__dirname, '../', './sql/Cache.sql'), 'utf-8');
  DB.Cache.exec(SQL);
};

export const CleanCache = (MaxDuration: number): void => {
  const Delete = DB.Cache.prepare('DELETE FROM inventory_cache WHERE updated >= ?');
  Delete.run(moment().subtract(MaxDuration, 'seconds').toISOString());
};

export const GetCache = (Key: string, Seconds = 5): AzulInventoryResponse | undefined => {
  const Select = DB.Cache.prepare('SELECT contents FROM inventory_cache WHERE id = ? AND updated >= ?');
  const Result = Select.get(Key, moment().subtract(Seconds, 'seconds').toISOString());
  if (Result?.contents) return JSON.parse(Result.contents.toString());
  return undefined;
};

export const SaveCache = (Key: string, contents: AzulInventoryResponse): void => {
  const Insert = DB.Cache.prepare('INSERT OR REPLACE INTO inventory_cache(id, contents, updated) VALUES (?, ?, ?)');
  Insert.run(Key, Buffer.from(JSON.stringify(contents)), new Date().toISOString());
};

export default {
  InitCache, GetCache, SaveCache,
};
