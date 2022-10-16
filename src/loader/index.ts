import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from 'axios';
import {
  DEFAULT_REQUEST_MAX_RETRIES,
  DEFAULT_REQUEST_RETRY_DELAY,
  DEFAULT_REQUEST_TIMEOUT,
} from '../constants';

import Axios from 'axios';
import type { ErrorWithEResult } from './types/error-with-eresult.type';
import EventEmitter from 'events';
import Inventory from '../inventory';
import type { InventoryLoaderConstructor } from './types/inventory-loader-constructor.type';
import type { ItemAsset } from '../inventory/types/item-asset.type';
import type { ItemDescription } from '../inventory/types/item-description.type';
import type { LoaderResponse } from './types/loader-response';
import LoaderUtils from './utils';
import { RequestParams } from './types/request-params.type';
import type { SteamBodyResponse } from './types/steam-body-response.type';

export default class InventoryLoader {
  private cookies?: string;

  private isFetchDone = false;

  private pagesDone = 0;

  private pagesReceived = 0;

  private readonly events: EventEmitter = new EventEmitter();

  private readonly inventory: Inventory;

  private retryCount = 0;

  private startAssetID?: string;

  public readonly appID: InventoryLoaderConstructor['appID'];

  public readonly axios: AxiosInstance = Axios.create({
    httpsAgent: LoaderUtils.getAgent(),
    responseType: 'json',
    timeout: DEFAULT_REQUEST_TIMEOUT,
  });

  public readonly contextID: InventoryLoaderConstructor['contextID'];

  public readonly language: string = 'english';

  public readonly maxRetries: number = DEFAULT_REQUEST_MAX_RETRIES;

  public readonly proxyAddress?: InventoryLoaderConstructor['proxyAddress'];

  public readonly steamCommunityJar?: InventoryLoaderConstructor['steamCommunityJar'];

  public readonly steamID64: string;

  public readonly useProxy: boolean = false;

  constructor({
    appID,
    contextID,
    steamID64,
    ...params
  }: InventoryLoaderConstructor) {
    this.appID = appID;
    this.contextID = contextID;

    this.inventory = new Inventory({
      contextID: String(this.contextID),
      tradableOnly: params?.tradableOnly ?? true,
    });

    if (typeof steamID64 !== 'string')
      this.steamID64 = steamID64.getSteamID64();
    else this.steamID64 = steamID64;

    if (params?.language) this.language = params.language;
    if (params?.maxRetries) this.maxRetries = params.maxRetries;
    if (params?.proxyAddress) this.proxyAddress = params.proxyAddress;

    if (params?.steamCommunityJar) {
      this.cookies = LoaderUtils.parseCookies(params?.steamCommunityJar);
    }

    if (params?.useProxy) this.useProxy = params.useProxy;
  }

  private clear(): void {
    this.events.removeAllListeners();
    this.inventory.clearCache();
  }

  private getDefaultHeaders(): RawAxiosRequestHeaders {
    const defaults: RawAxiosRequestHeaders = {
      Host: 'steamcommunity.com',
      Referer: `https://steamcommunity.com/profiles/${this.steamID64}/inventory`,
    };

    if (this.cookies) {
      return {
        ...defaults,
        Cookie: this.cookies,
      };
    }

    return defaults;
  }

  private fetchRetry(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.retryCount += 1;
        resolve(this.fetch());
      }, DEFAULT_REQUEST_RETRY_DELAY);
    });
  }

  private async fetch(): Promise<void> {
    const params: RequestParams = {
      l: this.language,
      count: 5000,
      start_assetid: this.startAssetID,
    };

    const options: AxiosRequestConfig<never> = {
      headers: this.getDefaultHeaders(),
      params,
    };

    if (this.useProxy && this.proxyAddress) {
      options.httpsAgent = LoaderUtils.getAgent(this.proxyAddress);
    }

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
        this.events.emit('done');
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

  private bindDataEvents() {
    this.events.on(
      'data',
      (itemDescriptions: ItemDescription[], itemAssets: ItemAsset[]) => {
        this.pagesReceived += 1;

        this.inventory.updateDescriptions(itemDescriptions);
        this.inventory.insertItems(itemAssets);

        this.pagesDone += 1;
        this.checkIfIsDone();
      },
    );
  }

  private checkIfIsDone(): void {
    if (this.isFetchDone && this.pagesReceived === this.pagesDone)
      this.events.emit('done');
  }

  private buildResponse(): LoaderResponse {
    const inventory = this.inventory.getInventory();

    return {
      count: inventory.length,
      inventory,
      success: true,
    };
  }

  public async loadInventory(): Promise<LoaderResponse> {
    const [result] = await Promise.all([
      (async function _(self) {
        return new Promise<LoaderResponse>((resolve, reject) => {
          self.bindDataEvents();

          self.events.once('done', () => {
            self.clear();
            resolve(self.buildResponse());
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
