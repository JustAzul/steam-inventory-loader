import { injectable } from 'tsyringe';

import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '@application/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import SteamItemFactory from '@domain/factories/steam-item.factory';
import { LoaderConfig } from '@domain/types/loader-config.type';

import InventoryPageService from './inventory-page.service';

export interface LoadInventoryParams {
  appID: string;
  config: LoaderConfig;
  contextID: string;
  steamID64: string;
}

/**
 * Service layer for Steam inventory operations
 * Provides cohesive business operations instead of exposing individual use cases
 */
@injectable()
export default class SteamInventoryService {
  public constructor(private readonly inventoryService: InventoryPageService) {}

  /**
   * Loads a complete Steam inventory for the specified user and application
   * @param params - Parameters for loading inventory
   * @returns Promise resolving to array of Steam items
   */
  public async loadInventory(
    params: LoadInventoryParams,
  ): Promise<SteamItemEntity[]> {
    const { config, steamID64, appID, contextID } = params;
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
