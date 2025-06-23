import { InventoryPageResult } from '@application/types/inventory-page-result.type';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';

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
        tradable: 1,
        name: 'Operation Breakout Weapon Case',
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
        appid: 730,
        contextid: '2',
        assetid: '2',
        classid: '789',
        instanceid: '101',
        amount: '1',
      },
    ],
    more_items: 1,
    rwgrsn: -1,
    success: 1,
    descriptions: [
      {
        ...baseDescription,
        classid: '789',
        instanceid: '101',
        market_hash_name: 'Chroma 2 Case',
        tradable: 0,
        name: 'Chroma 2 Case',
      },
    ],
    total_inventory_count: 2,
  },
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
        appid: 730,
        contextid: '2',
        assetid: '1',
        classid: '1',
        instanceid: '1',
        amount: '1',
      },
      {
        appid: 730,
        contextid: '2',
        assetid: '2',
        classid: '2',
        instanceid: '2',
        amount: '1',
      },
    ],
    descriptions: [
      {
        ...baseDescription,
        classid: '1',
        instanceid: '1',
        tradable: 1,
        name: 'Tradable Item',
        market_hash_name: 'Tradable Item',
      },
      {
        ...baseDescription,
        classid: '2',
        instanceid: '2',
        tradable: 0,
        name: 'Non-Tradable Item',
        market_hash_name: 'Non-Tradable Item',
      },
    ],
    more_items: 0,
    rwgrsn: 0,
    success: 1,
    total_inventory_count: 2,
  },
};

export const steamItemsMocks = {
  page1: [
    SteamItemEntity.create({
      asset: inventoryPageResultMock.page1.assets[0],
      description: inventoryPageResultMock.page1.descriptions[0],
    }),
  ],
  page2: [
    SteamItemEntity.create({
      asset: inventoryPageResultMock.page2.assets[0],
      description: inventoryPageResultMock.page2.descriptions[0],
    }),
  ],
  mixedTradablePage: [
    SteamItemEntity.create({
      asset: inventoryPageResultMock.mixedTradablePage.assets[0],
      description: inventoryPageResultMock.mixedTradablePage.descriptions[0],
    }),
    SteamItemEntity.create({
      asset: inventoryPageResultMock.mixedTradablePage.assets[1],
      description: inventoryPageResultMock.mixedTradablePage.descriptions[1],
    }),
  ],
};
