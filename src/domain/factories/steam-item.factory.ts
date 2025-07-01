import { injectable, inject } from 'tsyringe';

import SteamItemTag from '../entities/steam-item-tag.entity';
import SteamItemEntity from '../entities/steam-item.entity';
import DomainException from '../exceptions/domain.exception';
import { IAppSpecificLogic } from '../strategies/app-specific/IAppSpecificLogic';
import { AppSpecificLogicFactory } from '../strategies/app-specific.factory';
import { InventoryPageAsset } from '../types/inventory-page-asset.type';
import { InventoryPageDescription } from '../types/inventory-page-description.type';

type CreateProps = {
  asset: InventoryPageAsset;
  description: InventoryPageDescription;
  strategy: IAppSpecificLogic;
  tags?: SteamItemTag[];
};

@injectable()
export class SteamItemFactory {
  constructor(
    @inject(AppSpecificLogicFactory)
    private readonly appSpecificLogicFactory: AppSpecificLogicFactory,
  ) {}

  public createFromInventoryPage(
    assets: InventoryPageAsset[],
    descriptions: InventoryPageDescription[],
  ): SteamItemEntity[] {
    const descriptionMap = new Map<string, InventoryPageDescription>(
      descriptions.map((d) => [`${d.classid}-${d.instanceid}`, d]),
    );

    return assets
      .map((asset) => {
        const description = descriptionMap.get(
          `${asset.classid}-${asset.instanceid}`,
        );

        if (!description) {
          return undefined;
        }

        const strategy = this.appSpecificLogicFactory.create(
          Number(asset.appid),
        );

        return this.create({
            asset,
            description,
          strategy,
        });
      })
      .filter((item): item is SteamItemEntity => item !== undefined);
  }

  public create({
            asset,
    description,
            strategy,
            tags,
  }: CreateProps): SteamItemEntity {
    if (!asset.assetid) {
      throw new DomainException('SteamItemFactory', 'assetid is required');
  }
    if (!asset.appid) {
      throw new DomainException('SteamItemFactory', 'appid is required');
    }
    if (!asset.classid) {
      throw new DomainException('SteamItemFactory', 'classid is required');
    }
    if (!description.market_hash_name) {
      throw new DomainException(
        'SteamItemFactory',
        'market_hash_name is required',
      );
    }
    return new SteamItemEntity({ asset, description, strategy, tags });
    }
} 