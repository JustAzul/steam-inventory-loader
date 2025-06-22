import { injectable, inject } from 'tsyringe';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { LoaderConfig } from '@domain/types/loader-config.type';
import GetInventoryPageResultUseCase from './get-inventory-page-result.use-case';
import MapAssetsToSteamItemsUseCase from './map-assets-to-steam-items.use-case';
import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '@shared/constants';

export interface LoadInventoryUseCaseProps {
  steamID64: string;
  appID: string;
  contextID: string;
  config: LoaderConfig;
}

@injectable()
export default class LoadInventoryUseCase {
  public constructor(
    private readonly getInventoryPage: GetInventoryPageResultUseCase,
    private readonly mapAssetsToSteamItems: MapAssetsToSteamItemsUseCase,
  ) {}
  public async execute(
    props: LoadInventoryUseCaseProps,
  ): Promise<SteamItemEntity[]> {
    const { config, steamID64, appID, contextID } = props;
    const allItems: SteamItemEntity[] = [];
    let lastAssetID: string | undefined;
    let moreItems = true;

    do {
      const pageResult = await this.getInventoryPage.execute({
        steamID64,
        appID,
        contextID,
        language: config.Language ?? DEFAULT_REQUEST_LANGUAGE,
        count: config.itemsPerPage ?? DEFAULT_REQUEST_ITEM_COUNT,
        lastAssetID,
      });

      if (pageResult?.assets && pageResult?.descriptions) {
        const items = this.mapAssetsToSteamItems.execute({
          assets: pageResult.assets,
          descriptions: pageResult.descriptions,
        });
        allItems.push(...items);
      }

      moreItems = !!pageResult?.more_items;
      lastAssetID = pageResult?.last_assetid;
    } while (moreItems);

    if (config.tradableOnly) {
      return allItems.filter((item) => item.tradable);
    }
    return allItems;
  }
} 