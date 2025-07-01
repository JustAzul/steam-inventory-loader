import 'reflect-metadata';

import { IAppSpecificLogic } from '@domain/strategies/app-specific/IAppSpecificLogic';
import { AppSpecificLogicFactory } from '@domain/strategies/app-specific.factory';
import { inventoryPageResultMock } from '@domain/test/__mocks__';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';

import { SteamItemFactory } from '../steam-item.factory';

describe('SteamItemFactory', () => {
  let factory: SteamItemFactory;
  let mockAppSpecificLogicFactory: jest.Mocked<AppSpecificLogicFactory>;
  const mockStrategy: IAppSpecificLogic = {
    getCacheExpiration: () => undefined,
    getMarketFeeApp: () => undefined,
  };

  beforeEach(() => {
    mockAppSpecificLogicFactory = {
      create: jest.fn().mockReturnValue(mockStrategy),
    } as unknown as jest.Mocked<AppSpecificLogicFactory>;
    factory = new SteamItemFactory(mockAppSpecificLogicFactory);
  });

  it('should create steam items from inventory page', () => {
    const { assets, descriptions } = inventoryPageResultMock.page1;
    const items = factory.createFromInventoryPage(
      assets as InventoryPageAsset[],
      descriptions as InventoryPageDescription[],
    );
    expect(items).toHaveLength(1);
    expect(items[0].market_name).toBe('Operation Breakout Weapon Case');
  });

  it('should not create item if description is missing', () => {
    const { assets } = inventoryPageResultMock.page1;
    const items = factory.createFromInventoryPage(
      assets as InventoryPageAsset[],
      [],
    );
    expect(items).toHaveLength(0);
  });

  it('should create a valid steam item', () => {
    const { assets, descriptions } = inventoryPageResultMock.page1;
    const item = factory.create({
      asset: assets[0] as InventoryPageAsset,
      description: descriptions[0] as InventoryPageDescription,
      strategy: mockStrategy,
    });
    expect(item.market_name).toBe('Operation Breakout Weapon Case');
  });
});
