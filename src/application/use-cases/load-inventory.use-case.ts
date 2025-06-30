import SteamID from 'steamid';
import { inject, injectable } from 'tsyringe';

import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '@application/constants';
import ApplicationException from '@application/exceptions/application.exception';
import { IFetcher } from '@application/ports/fetcher.port';
import { getPageUrl } from '@application/utils/get-page-url';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import SteamItemFactory from '@domain/factories/steam-item.factory';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';
import { LoaderConfig } from '@domain/types/loader-config.type';

export interface LoadInventoryPageUseCaseProps {
  steamID64: string;
  appID: number;
  contextID: string;
  config: LoaderConfig;
}

@injectable()
export default class LoadInventoryUseCase {
  constructor(
    @inject('IFetcher')
    private readonly fetcher: IFetcher,
  ) {}

  private validate(props: LoadInventoryPageUseCaseProps): void {
    const { steamID64, appID, contextID } = props;
    if (!steamID64) {
      throw new ApplicationException(
        'LoadInventoryUseCase',
        'steamID64 is required',
      );
    }
    try {
      new SteamID(steamID64);
    } catch {
      throw new ApplicationException(
        'LoadInventoryUseCase',
        'steamID64 is invalid',
      );
    }
    if (!appID || appID <= 0) {
      throw new ApplicationException(
        'LoadInventoryUseCase',
        'appID must be a positive number',
      );
    }
    if (!contextID) {
      throw new ApplicationException(
        'LoadInventoryUseCase',
        'contextID is required',
      );
    }
  }

  private filterTradableItems(
    assets: InventoryPageAsset[],
    descriptions: InventoryPageDescription[],
  ): {
    assets: InventoryPageAsset[];
    descriptions: InventoryPageDescription[];
  } {
    const tradableDescriptions = descriptions.filter(
      (d: InventoryPageDescription) => d.tradable,
    );
    const tradableClassIds = tradableDescriptions.map(
      (d: InventoryPageDescription) => d.classid,
    );
    const tradableAssets = assets.filter((a: InventoryPageAsset) =>
      tradableClassIds.includes(a.classid),
    );
    return { assets: tradableAssets, descriptions: tradableDescriptions };
  }

  private async processInventoryPage(
    url: string,
    params: Record<string, string | number>,
    tradableOnly: boolean,
  ): Promise<{ items: SteamItemEntity[]; lastAssetId?: string }> {
    const pageResult = await this.fetcher.execute({
      params,
      url,
    });

    if (pageResult?.assets?.length && pageResult?.descriptions?.length) {
      let { assets, descriptions } = pageResult;

      if (tradableOnly) {
        ({ assets, descriptions } = this.filterTradableItems(
          assets,
          descriptions,
        ));
      }

      const items = SteamItemFactory.createFromInventoryPage(
        assets,
        descriptions,
      );
      return { items, lastAssetId: pageResult.last_assetid };
    }

    return { items: [] };
  }

  public async execute(
    props: LoadInventoryPageUseCaseProps,
  ): Promise<SteamItemEntity[]> {
    this.validate(props);
    const { config, steamID64, appID, contextID } = props;
    const allItems: SteamItemEntity[] = [];
    let lastAssetID: string | undefined;
    let moreItems = false;

    do {
      const { url, params } = getPageUrl({
        appID: String(appID),
        contextID,
        count: config.itemsPerPage ?? DEFAULT_REQUEST_ITEM_COUNT,
        language: config.language ?? DEFAULT_REQUEST_LANGUAGE,
        lastAssetID,
        steamID64,
      });

      const { items, lastAssetId } = await this.processInventoryPage(
        url,
        params,
        config.tradableOnly === true,
      );
      allItems.push(...items);
      lastAssetID = lastAssetId;
      moreItems =
        lastAssetId !== undefined && lastAssetId !== null && lastAssetId !== '';
    } while (moreItems);

    return allItems;
  }
}
