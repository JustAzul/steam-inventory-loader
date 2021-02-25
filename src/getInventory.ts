/* eslint-disable no-console */
import _got from 'got';
import HttpAgent from 'agentkeepalive';
import { duration } from 'moment';
import steamID from 'steamid';
import CEconItem, {
  Tag, ItemAsset, ItemDescription, ItemDetails,
} from './CEconItem';
import CookieParser from './CookieParser';
import Database from './Database';

const agent = {
  http: new HttpAgent(),
  https: new HttpAgent.HttpsAgent(),
};

const got = _got.extend({ agent, timeout: duration(50, 'seconds').asMilliseconds() });

interface SteamBodyResponse {
    error?: string,
    Error?: string,
    assets: ItemAsset[],
    descriptions: ItemDescription[],
    // eslint-disable-next-line camelcase
    more_items?: number,
    // eslint-disable-next-line camelcase
    last_assetid: string,
    // eslint-disable-next-line camelcase
    total_inventory_count: number,
    success: number,
    rwgrsn: number
}

interface ErrorWithEResult extends Error {
    eresult?: number | string
}

export interface AzulInventoryResponse {
    success: boolean,
    inventory: ItemDetails[],
    count: number
}

export const getTag = (tags: Tag[], category: string): Tag | null => {
  if (!tags) return null;
  return tags.find((tag) => tag.category === category) || null;
};

// eslint-disable-next-line camelcase
export const getLargeImageURL = ({ icon_url_large, icon_url }: ItemDescription | ItemDetails): string => `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url_large || icon_url}/`;
// eslint-disable-next-line camelcase
export const getImageURL = ({ icon_url }: ItemDescription | ItemDetails): string => `https://steamcommunity-a.akamaihd.net/economy/image/${icon_url}/`;

export const isCardType = (tags: Tag[]): undefined |false | 'Normal' | 'Foil' => {
  if (!tags) return false;

  try {
    if (getTag(tags, 'item_class')?.internal_name === 'item_class_2') {
      if (getTag(tags, 'cardborder')?.internal_name === 'cardborder_0') return 'Normal';
      if (getTag(tags, 'cardborder')?.internal_name === 'cardborder_1') return 'Foil';
    }
  } catch {
    return false;
  }

  return false;
};

function getDescriptionKey(description: ItemDescription | ItemAsset): string {
  return `${description.classid}_${(description.instanceid || '0')}_${description.appid}`;
}

// eslint-disable-next-line max-len
// eslint-disable-next-line max-len, camelcase, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
async function getInventory(SteamID64: string | steamID, appID: string | number, contextID: string | number, tradableOnly = true, SteamCommunity_Jar: any, useCache = true, CacheDuration = 15, useGC = false): Promise<AzulInventoryResponse> {
  // eslint-disable-next-line no-param-reassign
  if (typeof SteamID64 !== 'string') SteamID64 = SteamID64.getSteamID64();

  const CacheKey = `${SteamID64}_${appID}_${contextID}_${tradableOnly}`;

  let DescriptionsCache: {
        [Key: string]: ItemDescription
    } = {};

  if (useCache) {
    Database.InitCache();
    const Cache = Database.GetCache(CacheKey, CacheDuration);
    if (Cache) return Cache;
  }

  const headers = {
    Referer: `https://steamcommunity.com/profiles/${SteamID64}/inventory`,
    Host: 'steamcommunity.com',
  };

  // eslint-disable-next-line max-len, camelcase, no-underscore-dangle
  const cookieJar = SteamCommunity_Jar ? CookieParser(SteamCommunity_Jar._jar.store.idx) : undefined;

  // eslint-disable-next-line max-len, camelcase
  async function Get(inventory: ItemDetails[], start_assetid: string | undefined): Promise<AzulInventoryResponse> {
    const searchParams = {
      l: 'english',
      count: 5000,
      start_assetid,
    };

    // eslint-disable-next-line camelcase
    const got_o = {
      url: `https://steamcommunity.com/inventory/${SteamID64}/${appID}/${contextID}`,
      headers,
      searchParams,
      cookieJar,
      throwHttpErrors: false,
    };

    // const TestKey = `${SteamID64}/${inventory.length}`;
    // console.time(`${TestKey} Request`);

    const { statusCode, body }: {
            statusCode: number,
            body: string
        } = await got(got_o);

    // console.timeEnd(`${TestKey} Request`);

    // eslint-disable-next-line eqeqeq
    if (statusCode === 403 && body == 'null') throw new Error('This profile is private.');
    if (statusCode === 429) throw new Error('rate limited');

    const data: SteamBodyResponse = JSON.parse(body);

    if (statusCode === 500 && body && data.error) {
      let newError: ErrorWithEResult = new Error(data.error);
      const match = data.error.match(/^(.+) \((\d+)\)$/);

      if (match) {
        newError = new Error(match[1]);
        // eslint-disable-next-line prefer-destructuring
        newError.eresult = match[2];
      }

      throw newError;
    }

    if (!!data?.success && data?.total_inventory_count === 0) {
      const o = {
        success: !!data.success,
        inventory,
        count: data.total_inventory_count ?? 0,
      };

      return o;
    }

    if (!data || !data.success || !data?.assets || !data?.descriptions) {
      if (data) throw new Error(data?.error || data?.Error || 'Malformed response');
      throw new Error('Malformed response');
    }

    // console.time(`${TestKey} Parse`);

    // Parse Item Descriptions
    for (let i = 0; i < data.descriptions.length; i += 1) {
      const Key = getDescriptionKey(data.descriptions[i]);
      if (!Object.prototype.hasOwnProperty.call(DescriptionsCache, Key)) {
        DescriptionsCache[Key] = data.descriptions[i];
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    data.descriptions = null;

    // console.timeEnd(`${TestKey} Parse`);
    // console.time(`${TestKey} Set`);

    // const CEconItemProcess = [];

    for (let i = 0; i < data.assets.length; i += 1) {
      if (!data.assets[i].currencyid) {
        const Key = getDescriptionKey(data.assets[i]);
        const Description = DescriptionsCache[Key];

        if (!tradableOnly || (Description && Description.tradable)) {
          /* // eslint-disable-next-line no-await-in-loop */
          inventory.push(CEconItem(data.assets[i], Description, contextID.toString()));
        }
      }
    }

    // inventory.push(...await Promise.all(CEconItemProcess));

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    data.assets = null;

    // console.timeEnd(`${TestKey} Set`);

    // if(test) console.timeEnd(`${TestKey} Parse`);

    // if(useGC && global?.gc) global?.gc();
    if (data.more_items) return Get(inventory, data.last_assetid);

    const o = {
      success: true,
      inventory,
      count: inventory.length,
    };

    return o;
  }

  // console.time(`${SteamID64}`);

  const InventoryResult = await Get([], undefined);

  // console.timeEnd(`${SteamID64}`);
  // console.log(`Inventory Size: ${InventoryResult.count}`);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  DescriptionsCache = null;

  if (useGC && global?.gc) global?.gc();

  if (useCache) Database.SaveCache(CacheKey, InventoryResult);
  return InventoryResult;
}

export default getInventory;
