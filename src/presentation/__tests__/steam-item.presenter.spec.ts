import { STEAM_CDN_IMAGE_URL } from '@domain/constants';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { IAppSpecificLogic } from '@domain/strategies/app-specific/IAppSpecificLogic';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';
import { SteamItemPresenter } from '@presentation/steam-item.presenter';

const mockStrategy: IAppSpecificLogic = {
  getCacheExpiration: jest.fn(),
  getMarketFeeApp: jest.fn(),
};

describe('Presentation :: SteamItemPresenter', () => {
  const mockAsset: InventoryPageAsset = {
    amount: '1',
    appid: 730,
    assetid: '12345',
    classid: '54321',
    contextid: '2',
    instanceid: '1',
  };

  const mockDescription: Omit<InventoryPageDescription, 'tags'> = {
    actions: [],
    appid: 730,
    background_color: '',
    classid: '54321',
    commodity: 0,
    currency: 0,
    descriptions: [],
    icon_url: 'normal_icon.jpg',
    icon_url_large: 'large_icon.jpg',
    instanceid: '1',
    market_fee_app: 730,
    market_hash_name: 'Test Item',
    market_marketable_restriction: 0,
    market_name: 'Test Item',
    market_tradable_restriction: 0,
    marketable: 1,
    name: 'Test Item',
    tradable: 1,
    type: 'Base',
  };

  describe('getImageUrl', () => {
    it('should return the normal icon_url when size is not specified', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
      });
      const presenter = new SteamItemPresenter(entity);
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/normal_icon.jpg`;
      expect(presenter.getImageUrl()).toBe(expectedUrl);
    });

    it('should return the normal icon_url when size is "normal"', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
      });
      const presenter = new SteamItemPresenter(entity);
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/normal_icon.jpg`;
      expect(presenter.getImageUrl('normal')).toBe(expectedUrl);
    });

    it('should return the large icon_url when size is "large"', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
      });
      const presenter = new SteamItemPresenter(entity);
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/large_icon.jpg`;
      expect(presenter.getImageUrl('large')).toBe(expectedUrl);
    });

    it('should fall back to normal icon_url when size is "large" but icon_url_large is missing', () => {
      const descriptionWithoutLargeIcon = {
        ...mockDescription,
        icon_url_large: '',
        tags: [],
      };
      const entityWithoutLargeIcon = new SteamItemEntity({
        asset: mockAsset,
        description: descriptionWithoutLargeIcon,
        strategy: mockStrategy,
      });
      const presenter = new SteamItemPresenter(entityWithoutLargeIcon);
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/normal_icon.jpg`;
      expect(presenter.getImageUrl('large')).toBe(expectedUrl);
    });
  });
});
