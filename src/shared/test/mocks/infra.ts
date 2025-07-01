/* eslint-disable boundaries/no-private */
import {
  ItemDetails,
  LoaderResponse,
} from '@application/ports/dtos/steam-inventory-loader-dtos';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { IAppSpecificLogic } from '@domain/strategies/app-specific/IAppSpecificLogic';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';
import { CookieJar } from 'tough-cookie';

export const mockSteamCommunity = {
  jar: (): CookieJar => new CookieJar(),
};

export const mockError = new Error('mock');

const mockStrategy: IAppSpecificLogic = {
  getCacheExpiration: jest.fn(),
  getMarketFeeApp: jest.fn(),
};

const mockAsset: InventoryPageAsset = {
  amount: '1',
  appid: 730,
  assetid: '1234567890',
  classid: '12345',
  contextid: '2',
  instanceid: '67890',
};

const mockDescription: InventoryPageDescription = {
  actions: [{ link: 'a_link', name: 'Action' }],
  appid: 730,
  background_color: 'FFFFFF',
  classid: '12345',
  commodity: 1,
  currency: 0,
  descriptions: [],
  fraudwarnings: [],
  icon_url: 'icon.jpg',
  icon_url_large: 'large_icon.jpg',
  instanceid: '67890',
  market_fee_app: 0,
  market_hash_name: 'Test Item',
  market_marketable_restriction: 0,
  market_name: 'Test Item Market',
  market_tradable_restriction: 0,
  marketable: 1,
  name: 'Test Item Name',
  tags: [],
  tradable: 1,
  type: 'Test Type',
};

const mockItemEntity = new SteamItemEntity({
  asset: mockAsset,
  description: mockDescription,
  strategy: mockStrategy,
});

export const mockResponse: SteamItemEntity[] = [mockItemEntity];

const mockItemDetails: ItemDetails = {
  actions: [{ link: 'a_link', name: 'Action' }],
  amount: 1,
  appid: 730,
  assetid: '1234567890',
  background_color: 'FFFFFF',
  cache_expiration: undefined,
  classid: '12345',
  commodity: true,
  contextid: '2',
  currency: 0,
  descriptions: [],
  fraudwarnings: [],
  icon_url: 'icon.jpg',
  icon_url_large: 'large_icon.jpg',
  id: '1234567890',
  instanceid: '67890',
  is_currency: false,
  item_expiration: undefined,
  market_fee_app: undefined,
  market_hash_name: 'Test Item',
  market_marketable_restriction: 0,
  market_name: 'Test Item Market',
  market_tradable_restriction: 0,
  marketable: true,
  name: 'Test Item Name',
  owner: undefined,
  owner_actions: [],
  owner_descriptions: undefined,
  tags: [],
  tradable: true,
  type: 'Test Type',
};

export const mockInventory: LoaderResponse = {
  count: 1,
  inventory: [mockItemDetails],
  success: true,
}; 