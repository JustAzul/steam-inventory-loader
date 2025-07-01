import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { DefaultLogic } from '@domain/strategies/app-specific/default.logic';
import { IAppSpecificLogic } from '@domain/strategies/app-specific/IAppSpecificLogic';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';
import { SteamTag } from '@domain/types/steam-tag.type';

const mockStrategy: IAppSpecificLogic = {
  getCacheExpiration: jest.fn(),
  getMarketFeeApp: jest.fn(),
};

describe('Domain :: Entities :: SteamItemEntity', () => {
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

  const createEntityWithTags = (tags: SteamTag[]): SteamItemEntity => {
    const steamItemTags = tags.map((tag) => SteamItemTag.create(tag));
    return new SteamItemEntity({
      asset: mockAsset,
      description: { ...mockDescription, tags: [] } as InventoryPageDescription,
      strategy: mockStrategy,
      tags: steamItemTags,
    });
  };

  const normalCardTags: SteamTag[] = [
    {
      category: 'item_class',
      category_name: 'Item Class',
      color: '',
      internal_name: 'item_class_2',
      localized_tag_name: 'Trading Card',
      name: 'Trading Card',
    },
    {
      category: 'cardborder',
      category_name: 'Card Border',
      color: '',
      internal_name: 'cardborder_0',
      localized_tag_name: 'Normal',
      name: 'Normal',
    },
  ];

  describe('findTag', () => {
    it('should find a tag by its category name', () => {
      const entity = createEntityWithTags(normalCardTags);
      const tag = entity.findTag('item_class');
      expect(tag).toBeDefined();
      expect(tag?.category).toBe('item_class');
    });

    it('should return undefined if the tag is not found', () => {
      const entity = createEntityWithTags(normalCardTags);
      const tag = entity.findTag('non_existent_category');
      expect(tag).toBeUndefined();
    });

    it('should return undefined for an empty tags array', () => {
      const entity = createEntityWithTags([]);
      const tag = entity.findTag('item_class');
      expect(tag).toBeUndefined();
    });
  });

  describe('getStrategy', () => {
    it('should return the strategy object', () => {
      const entity = createEntityWithTags([]);
      expect(entity.getStrategy()).toBe(mockStrategy);
    });
  });

  describe('is_currency', () => {
    it('should return true if asset.is_currency is true', () => {
      const entity = new SteamItemEntity({
        asset: { ...mockAsset, is_currency: true } as InventoryPageAsset,
        description: mockDescription as InventoryPageDescription,
        strategy: new DefaultLogic(),
      });
      expect(entity['is_currency']).toBe(true);
    });
  });

  describe('id', () => {
    it('should return currencyid if item is currency', () => {
      const entity = new SteamItemEntity({
        asset: { ...mockAsset, currencyid: '123' } as InventoryPageAsset,
        description: mockDescription as InventoryPageDescription,
        strategy: new DefaultLogic(),
      });
      expect(entity.id).toBe('123');
    });

    it('should return assetid if item is not currency', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: mockDescription as InventoryPageDescription,
        strategy: new DefaultLogic(),
      });
      expect(entity.id).toBe(mockAsset.assetid);
    });
  });

  describe('getAppId', () => {
    it('should return the appid', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: mockDescription as InventoryPageDescription,
        strategy: new DefaultLogic(),
      });
      expect(entity.getAppId()).toBe(Number(mockAsset.appid));
    });
  });

  describe('assetid', () => {
    it('should return the assetid', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: mockDescription as InventoryPageDescription,
        strategy: new DefaultLogic(),
      });
      expect(entity.assetid).toBe(mockAsset.assetid);
    });
  });

  describe('owner_descriptions', () => {
    it('should return the owner_descriptions', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: mockDescription as InventoryPageDescription,
        strategy: new DefaultLogic(),
      });
      expect(entity.owner_descriptions).toBe(
        (mockDescription as InventoryPageDescription).owner_descriptions,
      );
    });
  });

  describe('owner getter', () => {
    it('should return undefined if owner property is missing', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: {
          ...mockDescription,
          tags: [],
        } as InventoryPageDescription,
        strategy: mockStrategy,
      });
      expect(entity.owner).toBeUndefined();
    });

    it('should return undefined if owner is an empty object', () => {
      const descriptionWithEmptyOwner = { ...mockDescription, owner: {} };
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: {
          ...descriptionWithEmptyOwner,
          tags: [],
        } as InventoryPageDescription,
        strategy: mockStrategy,
      });
      expect(entity.owner).toBeUndefined();
    });

    it('should return owner object if it exists', () => {
      const owner = { steamid: '123' };
      const descriptionWithOwner = { ...mockDescription, owner };
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: {
          ...descriptionWithOwner,
          tags: [],
        } as InventoryPageDescription,
        strategy: mockStrategy,
      });
      expect(entity.owner).toEqual(owner);
    });
  });

  describe('Simple Getters', () => {
    it('should return the correct values', () => {
      const entity = new SteamItemEntity({
        asset: mockAsset,
        description: mockDescription as InventoryPageDescription,
        strategy: new DefaultLogic(),
      });
      expect(entity.adapter.classid).toBe(mockAsset.classid);
      expect(entity.adapter.instanceid).toBe(mockAsset.instanceid);
      expect(entity.adapter.amount).toBe(Number(mockAsset.amount));
    });
  });
});
