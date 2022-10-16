import Axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from 'axios';

import { AzulInventoryResponse } from './types/azul-inventory-response.type';
import { ErrorWithEResult } from './types/error-with-eresult.type';
import EventEmitter from 'events';
import { InventoryLoaderConstructor } from './types/inventory-loader-constructor.type';
import { ItemAsset } from './types/item-asset.type';
import { ItemDescription } from './types/item-description.type';
import { ItemDetails } from './types/item-details.type';
import LoaderUtils from './loader-utils';
import { SteamBodyResponse } from './types/steam-body-response.type';
import { duration } from 'moment';

export default class LoaderInstance {
  public readonly appID: InventoryLoaderConstructor['appID'];

  public readonly axios: AxiosInstance = Axios.create();

  public readonly contextID: InventoryLoaderConstructor['contextID'];

  public readonly maxRetries: number = 3;

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

  private cookies = '';

  private static readonly retryInterval: number = duration(
    1,
    'second',
  ).asMilliseconds();

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
    if (params?.maxRetries) this.maxRetries = params.maxRetries;
    if (params?.proxyAddress) this.proxyAddress = params.proxyAddress;

    if (params?.steamCommunityJar) {
      this.cookies = LoaderUtils.parseCookies(params?.steamCommunityJar);
    }

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

  private getDefaultHeaders(): RawAxiosRequestHeaders {
    return {
      Cookie: this.cookies,
      Host: 'steamcommunity.com',
      Referer: `https://steamcommunity.com/profiles/${this.steamID64}/inventory`,
    };
  }

  private fetchRetry(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.retryCount += 1;
        resolve(this.fetch());
      }, LoaderInstance.retryInterval);
    });
  }

  private async fetch(): Promise<void> {
    const params = {
      l: this.language,
      count: 5000,
      start_assetid: this.startAssetID,
    };

    const options: AxiosRequestConfig<never> = {
      headers: {
        ...this.getDefaultHeaders(),
      },
      httpsAgent: LoaderUtils.getAgent(
        this.useProxy ? this.proxyAddress : undefined,
      ),
      params,
      responseType: 'json',
      timeout: duration(25, 'seconds').asMilliseconds(),
    };

    try {
      const {
        data,
      }: AxiosResponse<SteamBodyResponse, never> & { data: SteamBodyResponse } =
        await this.axios.get<
          SteamBodyResponse,
          AxiosResponse<SteamBodyResponse, never>,
          never
        >(
          `https://steamcommunity.com/inventory/${this.steamID64}/${this.appID}/${this.contextID}`,
          options,
        );

      if (!!data.success && data.total_inventory_count === 0) {
        this.events.emit('done', {
          success: !!data.success,
          inventory: [],
          count: data.total_inventory_count ?? 0,
        });

        return;
      }

      if (!data || !data?.success || !data?.assets || !data?.descriptions) {
        if (this.retryCount < this.maxRetries) {
          await this.fetchRetry();
          return;
        }

        if (data) {
          const message = data?.error || data?.Error;
          this.events.emit('error', new Error(message || 'Malformed response'));
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
    } catch (e) {
      if (!Axios.isAxiosError(e)) {
        this.events.emit('error', e);
        return;
      }

      const err = e as AxiosError<SteamBodyResponse, never>;

      if (err.response?.status === 403) {
        this.events.emit('error', new Error('This profile is private.'));
        return;
      }

      if (err.response?.status === 429) {
        this.events.emit('error', new Error('rate limited'));
        return;
      }

      if (err.response?.status !== 200) {
        if (err.response?.data && !!err.response?.data?.error) {
          let newError: ErrorWithEResult = new Error(err.response?.data?.error);
          const match = /^(.+) \((\d+)\)$/.exec(err.response?.data?.error);

          if (match) {
            const [, resErr, eResult] = match;

            newError = new Error(resErr);
            newError.eresult = eResult;
          }

          this.events.emit('error', newError);
          return;
        }

        if (this.retryCount < this.maxRetries) {
          await this.fetchRetry();
          return;
        }

        this.events.emit('error', new Error('Bad statusCode'));
        return;
      }

      this.events.emit('error', err);
    }
  }

  private updateDescriptionCache(itemDescriptions: ItemDescription[]) {
    for (let i = 0; i < itemDescriptions.length; i += 1) {
      const itemDescription = itemDescriptions[i];
      const descriptionKey = LoaderUtils.findDescriptionKey(itemDescription);

      if (!this.cache.has(descriptionKey)) {
        this.cache.set(descriptionKey, itemDescription);
      }
    }
  }

  private parseItems(itemAssets: ItemAsset[]) {
    for (let i = 0; i < itemAssets.length; i += 1) {
      const itemAsset = itemAssets[i];

      if (!itemAsset.currencyid) {
        const descriptionKey = LoaderUtils.findDescriptionKey(itemAsset);
        const description = this.cache.get(descriptionKey);

        if (!this.tradableOnly || (description && description?.tradable)) {
          if (description) {
            this.inventory.push(
              LoaderUtils.parseItem({
                contextID: this.contextID.toString(),
                description,
                item: itemAsset,
              }),
            );
          }
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