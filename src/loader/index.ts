import {
  DEFAULT_REQUEST_ENDPOINT,
  DEFAULT_REQUEST_ITEMS_COUNT,
  DEFAULT_REQUEST_RESPONSE_LANGUAGE,
  STEAM_APIS_ENDPOINT,
  STEAM_SUPPLY_ENDPOINT,
} from './constants';
import {
  DEFAULT_REQUEST_MAX_RETRIES,
  DEFAULT_REQUEST_RETRY_DELAY,
} from '../constants';

import { AxiosError } from 'axios';
import type { ErrorWithEResult } from './types/error-with-eresult.type';
import EventEmitter from 'events';
import HttpClient from './http-client';
import type { HttpClientConstructor } from './types/http-client-constructor.type';
import type { IncomingHttpHeaders } from 'http';
import Inventory from '../inventory';
import type { InventoryLoaderConstructor } from './types/inventory-loader-constructor.type';
import type { ItemAsset } from '../inventory/types/item-asset.type';
import type { ItemDescription } from '../inventory/types/item-description.type';
import type { LoaderResponse } from './types/loader-response';
import LoaderUtils from './utils';
import type { RequestParams } from './types/request-params.type';
import { SteamBodyResponse } from './types/steam-body-response.type';

export default class InventoryLoader {
  private isFetchDone = false;

  private itemsPerPage: number = DEFAULT_REQUEST_ITEMS_COUNT;

  private pagesDone = 0;

  private pagesReceived = 0;

  private readonly customEndpoint?: string;

  private readonly events: EventEmitter = new EventEmitter();

  private readonly httpClient: HttpClient;

  private readonly inventory: Inventory;

  private readonly SteamApisApiKey?: string;

  private readonly SteamSupplyApiKey?: string;

  private readonly UseSteamApis: boolean = false;

  private readonly UseSteamSupply: boolean = false;

  private retryCount = 0;

  private startAssetID?: string;

  public readonly appID: InventoryLoaderConstructor['appID'];

  public readonly contextID: InventoryLoaderConstructor['contextID'];

  public readonly language: string = DEFAULT_REQUEST_RESPONSE_LANGUAGE;

  public readonly maxRetries: number = DEFAULT_REQUEST_MAX_RETRIES;

  public readonly steamCommunityJar?: InventoryLoaderConstructor['steamCommunityJar'];

  public readonly steamID64: string;

  constructor({
    appID,
    contextID,
    steamID64,
    ...params
  }: InventoryLoaderConstructor) {
    const clientOptions: HttpClientConstructor = {};

    this.appID = appID;
    this.contextID = contextID;

    if (!!params?.customEndpoint && params.customEndpoint !== '') {
      this.SteamApisApiKey = undefined;
      this.SteamSupplyApiKey = undefined;

      this.UseSteamApis = false;
      this.UseSteamSupply = false;

      this.customEndpoint = params.customEndpoint;
    } else {
      this.SteamApisApiKey = params?.steamApisKey;
      this.UseSteamApis = !!this.SteamApisApiKey && this.SteamApisApiKey !== '';

      this.SteamSupplyApiKey = params?.steamSupplyKey;
      this.UseSteamSupply =
        !!this.SteamSupplyApiKey && this.SteamSupplyApiKey !== '';

      if (this.UseSteamApis || this.UseSteamSupply) {
        clientOptions.requestDelay = 0;
      }
    }

    const defaultCookies = [
      `strInventoryLastContext=${this.appID}_${this.contextID};`,
    ];

    this.inventory = new Inventory({
      contextID: String(this.contextID),
      tradableOnly: params?.tradableOnly ?? true,
    });

    if (typeof steamID64 !== 'string')
      this.steamID64 = steamID64.getSteamID64();
    else this.steamID64 = steamID64;

    if (params?.language) this.language = params.language;
    if (params?.maxRetries) this.maxRetries = params.maxRetries;

    if (
      Object.prototype.hasOwnProperty.call(params, 'requestDelay') &&
      typeof params.requestDelay === 'number'
    ) {
      clientOptions.requestDelay = params.requestDelay;
    }

    if (params?.itemsPerPage) {
      this.itemsPerPage = params.itemsPerPage;
    }

    if (params?.useProxy && params?.proxyAddress) {
      clientOptions.proxyAddress = params?.proxyAddress;
    }

    this.httpClient = new HttpClient(clientOptions);

    if (params?.steamCommunityJar) {
      defaultCookies.push(
        ...LoaderUtils.parseCookies(params?.steamCommunityJar),
      );
    }

    this.httpClient.setDefaultCookies(defaultCookies.join(' '));
    this.httpClient.setDefaultHeaders(this.getDefaultHeaders());
  }

  private clear(): void {
    this.events.removeAllListeners();
    this.inventory.clearCache();
    this.httpClient.destroy();
  }

  private getDefaultHeaders(): IncomingHttpHeaders {
    return {
      host: 'steamcommunity.com',
      referer: `https://steamcommunity.com/profiles/${this.steamID64}/inventory`,
    };
  }

  private findEndpoint(): string {
    if (this.UseSteamSupply && !!this.SteamSupplyApiKey) {
      return STEAM_SUPPLY_ENDPOINT.replaceAll(
        `{{API_KEY}}`,
        this.SteamSupplyApiKey,
      );
    }

    if (this.UseSteamApis && !!this.SteamApisApiKey) {
      return STEAM_APIS_ENDPOINT;
    }

    return this.customEndpoint || DEFAULT_REQUEST_ENDPOINT;
  }

  private getRequestParams(): RequestParams {
    return {
      l: this.language,
      count: this.itemsPerPage,
      start_assetid: this.startAssetID,
    };
  }

  private retryRequest(increaseCount = true): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (increaseCount) this.retryCount += 1;
        resolve(this.yieldRequest());
      }, DEFAULT_REQUEST_RETRY_DELAY);
    });
  }

  private async yieldRequest(): Promise<void> {
    const requestParams = this.getRequestParams();

    if (this.UseSteamSupply) {
      requestParams.appid = Number(this.appID);
      requestParams.contextid = Number(this.contextID);
      requestParams.count = 5000;
      requestParams.steamid = this.steamID64;
    } else if (this.UseSteamApis) {
      requestParams.api_key = this.SteamApisApiKey;
    }

    let endpoint = this.findEndpoint();

    if (!endpoint.includes('steam.supply')) {
      endpoint += `/${this.steamID64}/${this.appID}/${this.contextID}`;
    }

    try {
      const data = await this.httpClient.get(endpoint, requestParams);

      if (!!data.success && data.total_inventory_count === 0) {
        this.events.emit('done');
        return;
      }

      if (
        !endpoint.includes(DEFAULT_REQUEST_ENDPOINT) &&
        (data == null || data?.fake_redirect)
      ) {
        await this.retryRequest();
        return;
      }

      if (!data || !data?.success || !data?.assets || !data?.descriptions) {
        if (this.retryCount < this.maxRetries) {
          await this.retryRequest();
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
        await this.retryRequest();
        return;
      }

      this.isFetchDone = true;
      this.checkIfIsDone();
    } catch (e) {
      if (!HttpClient.isRequestError(e)) {
        this.events.emit('error', e);
        return;
      }

      const err = e as AxiosError<SteamBodyResponse, never>;

      if (endpoint.includes(STEAM_APIS_ENDPOINT)) {
        if (err.response?.status === 402) {
          this.events.emit(
            'error',
            new Error('Insufficient balance on steamapis.com'),
          );
          return;
        }

        if (err.response?.status === 401) {
          this.events.emit(
            'error',
            new Error('Insufficient permission on steamapis.com'),
          );
          return;
        }
      }

      if (err.response?.status === 403) {
        if (endpoint.includes('steam.supply')) {
          this.events.emit(
            'error',
            new Error(
              'This profile is either private, or you have issues with your steam.supply api key.',
            ),
          );
        } else this.events.emit('error', new Error('This profile is private.'));
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
          await this.yieldRequest();
          return;
        }

        this.events.emit('error', new Error('Bad statusCode'));
        return;
      }

      this.events.emit('error', err);
    }
  }

  private bindDataEvents(): void {
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

          self.events.once('done', () =>
            process.nextTick(() => {
              self.clear();
              resolve(self.buildResponse());
            }),
          );

          self.events.once('error', (error: Error) =>
            process.nextTick(() => {
              self.clear();
              reject(error);
            }),
          );
        });
      })(this),
      this.yieldRequest(),
    ]);

    return result;
  }
}
