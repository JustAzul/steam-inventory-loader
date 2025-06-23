import { inject, injectable } from 'tsyringe';

import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '@application/constants';
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

  public async execute(
    props: LoadInventoryPageUseCaseProps,
  ): Promise<SteamItemEntity[]> {
    const { config, steamID64, appID, contextID } = props;
    const allItems: SteamItemEntity[] = [];
    let lastAssetID: string | undefined;

    while (true) {
      const { url, params } = getPageUrl({
        appID: String(appID),
        contextID,
        count: config.itemsPerPage ?? DEFAULT_REQUEST_ITEM_COUNT,
        language: config.Language ?? DEFAULT_REQUEST_LANGUAGE,
        lastAssetID,
        steamID64,
      });

      const pageResult = await this.fetcher.execute({
        url,
        params,
      });

      if (pageResult?.assets && pageResult?.descriptions) {
        let assets = pageResult.assets;
        let descriptions = pageResult.descriptions;

        if (config.tradableOnly) {
          const tradableDescriptions = descriptions.filter(
            (d: InventoryPageDescription) => d.tradable,
          );
          const tradableClassIds = tradableDescriptions.map(
            (d: InventoryPageDescription) => d.classid,
          );
          assets = assets.filter((a: InventoryPageAsset) =>
            tradableClassIds.includes(a.classid),
          );
          descriptions = tradableDescriptions;
        }

        const items = SteamItemFactory.createFromInventoryPage(
          assets,
          descriptions,
        );
        allItems.push(...items);
      }

      if (!pageResult?.more_items) {
        break;
      }
      lastAssetID = pageResult.last_assetid;
    }

    return allItems;
  }
} 