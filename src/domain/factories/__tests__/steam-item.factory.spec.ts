import 'reflect-metadata';
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';
import { inventoryPageResultMock } from '@shared/test/__mocks__';

import SteamItemFactory from '../steam-item.factory';

describe('SteamItemFactory', () => {
  it('should create steam items from inventory page', () => {
    const { assets, descriptions } = inventoryPageResultMock.page1;
    const items = SteamItemFactory.createFromInventoryPage(
      assets as InventoryPageAsset[],
      descriptions as InventoryPageDescription[],
    );
    expect(items).toHaveLength(1);
    expect(items[0].market_hash_name).toBe(
      'Operation Breakout Weapon Case',
    );
  });

  it('should handle descriptions with listing keys', () => {
    const asset = inventoryPageResultMock.page1.assets[0];
    const description = inventoryPageResultMock.page1.descriptions[0];

    const descriptionWithListingKey = {
      ...description,
      [`${asset.classid}_${asset.instanceid}`]: {
        ...description,
        market_hash_name: 'Test Item',
      },
    };

    const items = SteamItemFactory.createFromInventoryPage(
      [asset as InventoryPageAsset],
      [descriptionWithListingKey as InventoryPageDescription],
    );
    expect(items).toHaveLength(1);
    expect(items[0].market_hash_name).toBe('Test Item');
  });

  it('should create tags for an item', () => {
    const assets = inventoryPageResultMock.page1.assets;
    const descriptions = [
      {
        ...inventoryPageResultMock.page1.descriptions[0],
        tags: [
          {
            internal_name: 'test_tag',
            name: 'Test Tag',
            category: 'Test Category',
            category_name: 'Test Category Name',
            localized_tag_name: 'Test Tag',
          },
        ],
      },
    ];
    const items = SteamItemFactory.createFromInventoryPage(
      assets as InventoryPageAsset[],
      descriptions as InventoryPageDescription[],
    );
    const tags = items[0].tags;
    expect(tags).toBeDefined();
    expect(tags).toHaveLength(1);
    expect(tags![0]).toBeInstanceOf(SteamItemTag);
    expect(tags![0].internal_name).toBe('test_tag');
  });

  it('should not create item if description is missing', () => {
    const assets = inventoryPageResultMock.page1.assets;
    const items = SteamItemFactory.createFromInventoryPage(
      assets as InventoryPageAsset[],
      [],
    );
    expect(items).toHaveLength(0);
  });
}); 