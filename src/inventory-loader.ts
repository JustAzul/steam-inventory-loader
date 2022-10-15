import got, { OptionsOfTextResponseBody } from 'got';

import { AzulInventoryResponse } from './types/azul-inventory-response.type';
import { ErrorWithEResult } from './types/error-with-eresult.type';
import EventEmitter from 'events';
import { InventoryLoaderConstructor } from './types/inventory-loader-constructor.type';
import { ItemAsset } from './types/item-asset.type';
import { ItemDescription } from './types/item-description.type';
import { ItemDetails } from './types/item-details.type';
import { SteamBodyResponse } from './types/steam-body-response.type';
import { duration } from 'moment';
import utils from './utils';

export default class InventoryLoader {
  public readonly appID: InventoryLoaderConstructor['appID'];

  public readonly contextID: InventoryLoaderConstructor['contextID'];

  public readonly language: InventoryLoaderConstructor['language'] = 'english';

  public readonly proxyAddress?: InventoryLoaderConstructor['proxyAddress'];

  public readonly steamCommunityJar?: InventoryLoaderConstructor['steamCommunityJar'];

  public readonly steamID64: string;

  public readonly tradableOnly: InventoryLoaderConstructor['tradableOnly'] =
    true;

  public readonly useProxy: InventoryLoaderConstructor['useProxy'] = false;

  private readonly cache: Map<string, ItemDescription> = new Map();

  private readonly events: EventEmitter = new EventEmitter();

  private readonly inventory: ItemDetails[] = [];

  private retryCount = 0;

  private startAssetID?: string;

  private isFetchDone = false;

  private pagesDone = 0;

  private pagesReceived = 0;

  constructor({
    appID,
    contextID,
    steamID64,
    ...params
  }: InventoryLoaderConstructor) {
    this.appID = appID;
    this.contextID = contextID;

    if (typeof steamID64 !== 'string')
      this.steamID64 = steamID64.getSteamID64();
    else this.steamID64 = steamID64;

    if (params?.language) this.language = params.language;
    if (params?.proxyAddress) this.proxyAddress = params.proxyAddress;
    if (params?.steamCommunityJar)
      this.steamCommunityJar = params.steamCommunityJar;
    if (params?.tradableOnly) this.tradableOnly = params.tradableOnly;
    if (params?.useProxy) this.useProxy = params.useProxy;
  }

  private clear(): void {
    this.events.removeAllListeners();

    process.nextTick(() => {
      this.cache.clear();
      if (global?.gc) global.gc();
    });
  }

  private getHeaders() {
    return {
      Referer: `https://steamcommunity.com/profiles/${this.steamID64}/inventory`,
      Host: 'steamcommunity.com',
    };
  }

  private fetchRetry(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.retryCount += 1;
        resolve(this.fetch());
      }, duration(1, 'second').asMilliseconds());
    });
  }

  private async fetch(): Promise<void> {
    const searchParams = {
      l: this.language,
      count: 5000,
      start_assetid: this.startAssetID,
    };

    const gotOptions: OptionsOfTextResponseBody = {
      url: `https://steamcommunity.com/inventory/${this.steamID64}/${this.appID}/${this.contextID}`,
      headers: this.getHeaders(),
      searchParams,
      cookieJar: this.steamCommunityJar,
      throwHttpErrors: false,
      timeout: duration(25, 'seconds').asMilliseconds(),
      agent: {
        https: utils.getAgent(this.useProxy ? this.proxyAddress : undefined),
      },
    };

    // eslint-disable-next-line prefer-const
    let { statusCode, body } = await got(gotOptions);

    // eslint-disable-next-line eqeqeq
    if (statusCode === 403 && body == 'null') {
      this.events.emit('error', new Error('This profile is private.'));
      return;
    }

    if (statusCode === 429) {
      this.events.emit('error', new Error('rate limited'));
      return;
    }

    let data: SteamBodyResponse;

    try {
      data = JSON.parse(body);
    } catch {
      if (this.retryCount < 3) {
        this.fetchRetry();
        return;
      }

      this.events.emit('error', new Error('Malformed response'));
      return;
    }

    if (statusCode !== 200) {
      if (body && !!data?.error) {
        let newError: ErrorWithEResult = new Error(data.error);
        const match = /^(.+) \((\d+)\)$/.exec(data.error);

        if (match) {
          newError = new Error(match[1]);
          // eslint-disable-next-line prefer-destructuring
          newError.eresult = match[2];
        }

        this.events.emit('error', newError);
        return;
      }

      if (this.retryCount < 3) {
        await this.fetchRetry();
        return;
      }

      this.events.emit('error', new Error('Bad statusCode'));
      return;
    }

    if (!!data?.success && data?.total_inventory_count === 0) {
      this.events.emit('done', {
        success: !!data.success,
        inventory: [],
        count: data.total_inventory_count ?? 0,
      });
      return;
    }

    if (!data || !data?.success || !data?.assets || !data?.descriptions) {
      if (this.retryCount < 3) {
        await this.fetchRetry();
        return;
      }

      if (data) {
        this.events.emit(
          'error',
          new Error(data?.error || data?.Error || 'Malformed response'),
        );
        return;
      }

      this.events.emit('error', new Error('Malformed response'));
      return;
    }

    this.events.emit('data', data.descriptions, data.assets);

    if (data.more_items) {
      this.startAssetID = data.last_assetid;
      await this.fetchRetry();
      return;
    }

    this.isFetchDone = true;
    this.checkIfIsDone();
  }

  private updateDescriptionCache(itemDescriptions: ItemDescription[]) {
    for (let i = 0; i < itemDescriptions.length; i += 1) {
      const itemDescription = itemDescriptions[i];
      const descriptionKey = utils.findDescriptionKey(itemDescription);

      if (this.cache.has(descriptionKey)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      this.cache.set(descriptionKey, itemDescription);
    }
  }

  private parseItems(itemAssets: ItemAsset[]) {
    for (let i = 0; i < itemAssets.length; i += 1) {
      const itemAsset = itemAssets[i];

      if (!itemAsset.currencyid) {
        const descriptionKey = utils.findDescriptionKey(itemAsset);
        const description = this.cache.get(descriptionKey);

        if (!this.tradableOnly || (description && description?.tradable)) {
          const item = utils.parseItem({
            contextID: this.contextID.toString(),
            // @ts-expect-error Description will never be undefined.
            description,
            item: itemAsset,
          });

          this.inventory.push(item);
        }
      }
    }
  }

  private bindDataEvents() {
    this.events.on(
      'data',
      (itemDescriptions: ItemDescription[], itemAssets: ItemAsset[]) => {
        this.pagesReceived += 1;

        this.updateDescriptionCache(itemDescriptions);
        this.parseItems(itemAssets);

        this.pagesDone += 1;
        this.checkIfIsDone();
      },
    );
  }

  private checkIfIsDone(): void {
    if (this.isFetchDone && this.pagesReceived === this.pagesDone)
      this.events.emit('done');
  }

  public async loadInventory(): Promise<AzulInventoryResponse> {
    const [result] = await Promise.all([
      (async function _(self) {
        return new Promise<AzulInventoryResponse>((resolve, reject) => {
          self.bindDataEvents();

          self.events.once('done', () => {
            const inventoryResult: AzulInventoryResponse = {
              count: self.inventory.length,
              inventory: self.inventory,
              success: true,
            };

            self.clear();
            resolve(inventoryResult);
          });

          self.events.once('error', (error: Error) => {
            self.clear();
            reject(error);
          });
        });
      })(this),
      this.fetch(),
    ]);

    return result;
  }
}
