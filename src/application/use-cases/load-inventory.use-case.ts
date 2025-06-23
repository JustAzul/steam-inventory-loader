import SteamItemEntity from '@domain/entities/steam-item.entity';
import { inject, injectable } from 'tsyringe';
import { IInventoryPageService } from '@application/ports/inventory-page-service.interface';
import SteamItemFactory from '@domain/factories/steam-item.factory';
import {
  DEFAULT_REQUEST_ITEM_COUNT,
  DEFAULT_REQUEST_LANGUAGE,
} from '@application/constants';
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
    @inject('IInventoryPageService')
    private readonly inventoryPageService: IInventoryPageService,
  ) {}

  public async execute(
    props: LoadInventoryPageUseCaseProps,
  ): Promise<SteamItemEntity[]> {
    const { config, steamID64, appID, contextID } = props;
    const allItems: SteamItemEntity[] = [];
    let lastAssetID: string | undefined;

    while (true) {
      const pageResult = await this.inventoryPageService.getInventoryPage({
        appID: String(appID),
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