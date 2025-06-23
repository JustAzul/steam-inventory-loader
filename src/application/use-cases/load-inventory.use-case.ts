import SteamItemEntity from '@domain/entities/steam-item.entity';
import { LoaderConfig } from '@domain/types/loader-config.type';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '@application/constants';
import { injectable } from 'tsyringe';

import InventoryPageService from '../services/inventory-page.service';

import MapAssetsToSteamItemsUseCase from './map-assets-to-steam-items.use-case';

export interface LoadInventoryUseCaseProps {
  appID: string;
  config: LoaderConfig;
  contextID: string;
  steamID64: string;
}

@injectable()
export default class LoadInventoryUseCase {
  public constructor(
    private readonly inventoryService: InventoryPageService,
    private readonly mapAssetsToSteamItems: MapAssetsToSteamItemsUseCase,
  ) {}

  public async execute(
    props: LoadInventoryUseCaseProps,
  ): Promise<SteamItemEntity[]> {
    const { config, steamID64, appID, contextID } = props;
    const allItems: SteamItemEntity[] = [];
    let lastAssetID: string | undefined;

     
    while (true) {
      const pageResult = await this.inventoryService.getInventoryPage({
        appID,
        contextID,
        count: config.itemsPerPage ?? DEFAULT_REQUEST_ITEM_COUNT,
        language: config.Language ?? DEFAULT_REQUEST_LANGUAGE,
        lastAssetID,
        steamID64,
      });

      if (pageResult?.assets && pageResult?.descriptions) {
        let assets = pageResult.assets;
        let descriptions = pageResult.descriptions;

        if (config.tradableOnly) {
          const tradableDescriptions = descriptions.filter((d) => d.tradable);
          const tradableClassIds = tradableDescriptions.map((d) => d.classid);
          assets = assets.filter((a) => tradableClassIds.includes(a.classid));
          descriptions = tradableDescriptions;
        }

        const items = this.mapAssetsToSteamItems.execute({
          assets,
          descriptions,
        });
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
