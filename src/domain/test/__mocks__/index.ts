import SteamItemEntity from '../../entities/steam-item.entity';
import { AppSpecificLogicFactory } from '../../strategies/app-specific.factory';
import { InventoryPageDescription } from '../../types/inventory-page-description.type';
import { InventoryPageResult } from '../../types/inventory-page-result.type';

const baseDescription: InventoryPageDescription = {
  actions: [],
  appid: 730,
  background_color: '',
  classid: '',
  commodity: 0,
  currency: 0,
  descriptions: [],
  icon_url: '',
  icon_url_large: '',
  instanceid: '',
  market_fee_app: 0,
  market_hash_name: '',
  market_marketable_restriction: 0,
  market_name: '',
  market_tradable_restriction: 0,
  marketable: 0,
  name: '',
  tags: [],
  tradable: 0,
  type: '',
};

export const inventoryPageResultMock: {
  page1: InventoryPageResult;
  page2: InventoryPageResult;
  emptyPage: InventoryPageResult;
  mixedTradablePage: InventoryPageResult;
} = {
  emptyPage: {
    assets: [],
    descriptions: [],
    more_items: 0,
    rwgrsn: 0,
    success: 1,
    total_inventory_count: 2,
  },
  mixedTradablePage: {
    assets: [
      {
        amount: '1',
        appid: 730,
        assetid: '1',
        classid: '1',
        contextid: '2',
        instanceid: '1',
      },
      {
        amount: '1',
        appid: 730,
        assetid: '2',
        classid: '2',
        contextid: '2',
        instanceid: '2',
      },
    ],
    descriptions: [
      {
        ...baseDescription,
        classid: '1',
        instanceid: '1',
        market_hash_name: 'Tradable Item',
        name: 'Tradable Item',
        tradable: 1,
      },
      {
        ...baseDescription,
        classid: '2',
        instanceid: '2',
        market_hash_name: 'Non-Tradable Item',
        name: 'Non-Tradable Item',
        tradable: 0,
      },
    ],
    more_items: 0,
    rwgrsn: 0,
    success: 1,
    total_inventory_count: 2,
  },
  page1: {
    assets: [
      {
        amount: '1',
        appid: 730,
        assetid: '1',
        classid: '123',
        contextid: '2',
        instanceid: '456',
      },
    ],
    descriptions: [
      {
        ...baseDescription,
        classid: '123',
        instanceid: '456',
        market_hash_name: 'Operation Breakout Weapon Case',
        name: 'Operation Breakout Weapon Case',
        tradable: 1,
      },
    ],
    last_assetid: '1',
    more_items: 1,
    rwgrsn: -2,
    success: 1,
    total_inventory_count: 2,
  },
  page2: {
    assets: [
      {
        amount: '1',
        appid: 730,
        assetid: '2',
        classid: '789',
        contextid: '2',
        instanceid: '101',
      },
    ],
    descriptions: [
      {
        ...baseDescription,
        classid: '789',
        instanceid: '101',
        market_hash_name: 'Chroma 2 Case',
        name: 'Chroma 2 Case',
        tradable: 0,
      },
    ],
    more_items: 1,
    rwgrsn: -1,
    success: 1,
    total_inventory_count: 2,
  },
};

export const steamItemsMocks = {
  mixedTradablePage: [
    SteamItemEntity.create({
      asset: inventoryPageResultMock.mixedTradablePage.assets[0],
      description: inventoryPageResultMock.mixedTradablePage.descriptions[0],
      strategy: AppSpecificLogicFactory.create(
        inventoryPageResultMock.mixedTradablePage.assets[0].appid,
      ),
    }),
    SteamItemEntity.create({
      asset: inventoryPageResultMock.mixedTradablePage.assets[1],
      description: inventoryPageResultMock.mixedTradablePage.descriptions[1],
      strategy: AppSpecificLogicFactory.create(
        inventoryPageResultMock.mixedTradablePage.assets[1].appid,
      ),
    }),
  ],
  page1: [
    SteamItemEntity.create({
      asset: inventoryPageResultMock.page1.assets[0],
      description: inventoryPageResultMock.page1.descriptions[0],
      strategy: AppSpecificLogicFactory.create(
        inventoryPageResultMock.page1.assets[0].appid,
      ),
    }),
  ],
  page2: [
    SteamItemEntity.create({
      asset: inventoryPageResultMock.page2.assets[0],
      description: inventoryPageResultMock.page2.descriptions[0],
      strategy: AppSpecificLogicFactory.create(
        inventoryPageResultMock.page2.assets[0].appid,
      ),
    }),
  ],
};
