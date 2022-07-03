/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import CEconItem, {
  ItemAsset,
  ItemDescription,
  ItemDetails,
  Tag,
} from './CEconItem';

import { CookieJar } from 'tough-cookie';
import EventEmitter from 'events';
import { duration } from 'moment';
import getAgent from './getAgent';
import got from 'got';
import steamID from 'steamid';

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

interface DescriptionCacheType {
  [Key: string]: ItemDescription
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

// eslint-disable-next-line max-len, camelcase, @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
async function getInventory(SteamID64: string | steamID, appID: string | number, contextID: string | number, tradableOnly = true, SteamCommunity_Jar: CookieJar, Language: string, useProxy: boolean, proxyAddress: string): Promise<AzulInventoryResponse> {
  // eslint-disable-next-line no-param-reassign
  if (typeof SteamID64 !== 'string') SteamID64 = SteamID64.getSteamID64();

  const headers = {
    Referer: `https://steamcommunity.com/profiles/${SteamID64}/inventory`,
    Host: 'steamcommunity.com',
  };

  let DescriptionsCache: DescriptionCacheType = {};

  const inventory: ItemDetails[] = [];

  let GcPages = 0;
  const Event = new EventEmitter();

  const GetDescription = (Key: string): ItemDescription | undefined => DescriptionsCache[Key] || undefined;

  const RemoveListeners = () => {
    Event.removeAllListeners('FetchDone');
    Event.removeAllListeners('data');
    Event.removeAllListeners('done');
    Event.removeAllListeners('error');
  };

  async function Fetch(StartAssetID: string | undefined, Retries: number): Promise<void> {
    const searchParams = {
      l: Language,
      count: 5000,
      start_assetid: StartAssetID,
    };

    const GotOptions = {
      url: `https://steamcommunity.com/inventory/${SteamID64}/${appID}/${contextID}`,
      headers,
      searchParams,
      cookieJar: SteamCommunity_Jar,
      throwHttpErrors: false,
      timeout: duration(25, 'seconds').asMilliseconds(),
      agent: {
        https: getAgent(useProxy ? proxyAddress : 'false'),
      },
    };

    // eslint-disable-next-line prefer-const
    let { statusCode, body } = await got(GotOptions);

    // eslint-disable-next-line eqeqeq
    if (statusCode === 403 && body == 'null') {
      Event.emit('error', new Error('This profile is private.'));
      return;
    }

    if (statusCode === 429) {
      Event.emit('error', new Error('rate limited'));
      return;
    }

    const FetchRetry = () => setTimeout(() => Fetch(StartAssetID, (Retries + 1)), duration(1, 'second').asMilliseconds());

    let data: SteamBodyResponse;

    try {
      data = JSON.parse(body);
    } catch {
      if (Retries < 3) {
        FetchRetry();
        return;
      }

      Event.emit('error', new Error('Malformed response'));
      return;
    }

    if (statusCode !== 200) {
      if (body && !!data?.error) {
        let newError: ErrorWithEResult = new Error(data.error);
        const match = data.error.match(/^(.+) \((\d+)\)$/);

        if (match) {
          newError = new Error(match[1]);
          // eslint-disable-next-line prefer-destructuring
          newError.eresult = match[2];
        }

        Event.emit('error', newError);
        return;
      }

      if (Retries < 3) {
        FetchRetry();
        return;
      }

      Event.emit('error', new Error('Bad statusCode'));
      return;
    }

    if (!!data?.success && data?.total_inventory_count === 0) {
      const o = {
        success: !!data.success,
        inventory: [],
        count: data.total_inventory_count ?? 0,
      };

      Event.emit('done', o);
      return;
    }

    if (!data || !data?.success || !data?.assets || !data?.descriptions) {
      if (Retries < 3) {
        FetchRetry();
        return;
      }

      if (data) {
        Event.emit('error', new Error(data?.error || data?.Error || 'Malformed response'));
        return;
      }

      Event.emit('error', new Error('Malformed response'));
      return;
    }

    Event.emit('data', data.descriptions, data.assets);

    if (data.more_items) {
      const { LastAssetID } = { LastAssetID: data.last_assetid };

      // @ts-expect-error we are not using this var anymore.
      process.nextTick(() => { data = null; });

      if (global.gc) {
        GcPages += 1;
        if (GcPages > 3) {
          global.gc();
          GcPages = 0;
        }
      }

      Fetch(LastAssetID, 0);
    } else Event.emit('FetchDone');
  }

  Fetch(undefined, 0);

  return new Promise((resolve, reject) => {
    let TotalPages = 0;
    let PagesDone = 0;

    Event.on('data', async (Descriptions: ItemDescription[], Assets: ItemAsset[]) => {
      TotalPages += 1;

      {
        const Iterate = ():Promise<void> => new Promise((Resolve) => {
          const Execute = (i = 0) => {
            if (i === Descriptions.length) {
              Resolve();
              return;
            }

            const Description = Descriptions[i];
            const Key = getDescriptionKey(Description);
            if (!Object.prototype.hasOwnProperty.call(DescriptionsCache, Key)) DescriptionsCache[Key] = Description;

            setImmediate(Execute.bind(null, i + 1));
          };

          Execute();
        });

        await Iterate();
      }

      {
        const Iterate = ():Promise<void> => new Promise((Resolve) => {
          const Execute = async (i = 0) => {
            if (i === Assets.length) {
              Resolve();
              return;
            }

            const Asset: ItemAsset = Assets[i];

            if (!Asset.currencyid) {
              const Key = getDescriptionKey(Asset);
              const Description = GetDescription(Key);

              if (!tradableOnly || (Description && Description.tradable)) {
              // @ts-expect-error Description will never be undefined.
                const Item = await CEconItem(Asset, Description, contextID.toString());
                inventory.push(Item);
              }
            }

            setImmediate(Execute.bind(null, i + 1));
          };

          Execute();
        });

        await Iterate();
      }

      PagesDone += 1;
    });

    Event.once('FetchDone', async () => {
      {
        const Check = ():Promise<void> => new Promise((SetJobDone) => {
          const Execute = () => {
            if (TotalPages === PagesDone) SetJobDone();
            else setTimeout(Execute, 100);
          };

          Execute();
        });

        await Check();
      }

      const o = {
        success: true,
        inventory,
        count: inventory.length,
      };

      Event.emit('done', o);
    });

    Event.once('done', async (Result) => {
      resolve(Result);

      RemoveListeners();

      process.nextTick(() => {
      // @ts-expect-error cleaning unused cache
        DescriptionsCache = null;
        if (global.gc) global.gc();
      });
    });

    Event.once('error', (error) => {
      RemoveListeners();
      reject(error);
    });
  });
}

export default getInventory;
