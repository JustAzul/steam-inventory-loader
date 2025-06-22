import { InventoryPageResult } from '@application/types/inventory-page-result.type';

const baseDescription = {
  appid: 730,
  background_color: '3C352E',
  commodity: 0,
  currency: 0,
  descriptions: [],
  icon_url: '',
  icon_url_large: '',
  market_fee_app: 730,
  market_marketable_restriction: 7,
  market_name: '',
  market_tradable_restriction: 7,
  marketable: 1,
  name: '',
  tags: [],
  type: '',
  actions: [],
};

export const inventoryPageResultMock: {
  page1: InventoryPageResult;
  page2: InventoryPageResult;
} = {
  page1: {
    assets: [
      {
        appid: 730,
        contextid: '2',
        assetid: '1',
        classid: '123',
        instanceid: '456',
        amount: '1',
      },
    ],
    descriptions: [
      {
        ...baseDescription,
        classid: '123',
        instanceid: '456',
        market_hash_name: 'Operation Breakout Weapon Case',
        tradable: 1,
      },
    ],
    total_inventory_count: 2,
    success: 1,
    rwgrsn: -2,
    more_items: 1,
    last_assetid: '1',
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
    descriptions: [
      {
        ...baseDescription,
        classid: '789',
        instanceid: '101',
        market_hash_name: 'Chroma 2 Case',
        tradable: 0,
      },
    ],
    total_inventory_count: 2,
    success: 1,
    rwgrsn: -2,
  },
}; 