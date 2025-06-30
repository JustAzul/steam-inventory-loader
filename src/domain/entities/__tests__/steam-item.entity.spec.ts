import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import SteamItemEntity from '@domain/entities/steam-item.entity';
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
    return SteamItemEntity.create({
      asset: mockAsset,
      description: { ...mockDescription, tags: [] }, // Pass empty tags here
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

  describe('create', () => {
    it('should throw DomainException if assetid is missing', () => {
      const asset = { ...mockAsset, assetid: '' };
      expect(() =>
        SteamItemEntity.create({
          asset,
          description: { ...mockDescription, tags: [] },
          strategy: mockStrategy,
        }),
      ).toThrow('assetid is required');
    });

    it('should throw DomainException if appid is missing', () => {
      const asset = { ...mockAsset, appid: undefined };
      expect(() =>
        SteamItemEntity.create({
          asset: asset as unknown as InventoryPageAsset,
          description: { ...mockDescription, tags: [] },
          strategy: mockStrategy,
        }),
      ).toThrow('appid is required');
    });

    it('should throw DomainException if classid is missing', () => {
      const asset = { ...mockAsset, classid: '' };
      expect(() =>
        SteamItemEntity.create({
          asset,
          description: { ...mockDescription, tags: [] },
          strategy: mockStrategy,
        }),
      ).toThrow('classid is required');
    });

    it('should throw DomainException if market_hash_name is missing', () => {
      const description = { ...mockDescription, market_hash_name: '' };
      expect(() =>
        SteamItemEntity.create({
          asset: mockAsset,
          description: { ...description, tags: [] },
          strategy: mockStrategy,
        }),
      ).toThrow('market_hash_name is required');
    });
  });

  describe('id', () => {
    it('should return assetid for non-currency items', () => {
      const entity = SteamItemEntity.create({
        asset: mockAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
      });
      expect(entity.id).toBe(mockAsset.assetid);
    });

    it('should return currencyid for currency items', () => {
      const currencyAsset = { ...mockAsset, currencyid: '123' };
      const entity = SteamItemEntity.create({
        asset: currencyAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
      });
      expect(entity.id).toBe('123');
    });
  });

  describe('owner getter', () => {
    it('should return undefined if owner property is missing', () => {
      const entity = SteamItemEntity.create({
        asset: mockAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
      });
      expect(entity.owner).toBeUndefined();
    });

    it('should return undefined if owner is an empty object', () => {
      const descriptionWithEmptyOwner = { ...mockDescription, owner: {} };
      const entity = SteamItemEntity.create({
        asset: mockAsset,
        description: { ...descriptionWithEmptyOwner, tags: [] },
        strategy: mockStrategy,
      });
      expect(entity.owner).toBeUndefined();
    });

    it('should return owner object if it exists', () => {
      const owner = { steamid: '765' };
      const descriptionWithOwner = { ...mockDescription, owner };
      const entity = SteamItemEntity.create({
        asset: mockAsset,
        description: { ...descriptionWithOwner, tags: [] },
        strategy: mockStrategy,
      });
      expect(entity.owner).toEqual(owner);
    });
  });

  describe('getters with default values', () => {
    it('should handle missing optional description fields', () => {
      const partialDescription: Partial<typeof mockDescription> = {
        ...mockDescription,
      };
      delete partialDescription.owner_descriptions;
      delete partialDescription.item_expiration;
      delete partialDescription.fraudwarnings;
      delete partialDescription.descriptions;
      delete partialDescription.actions;

      const entity = SteamItemEntity.create({
        asset: mockAsset,
        description: {
          ...(partialDescription as InventoryPageDescription),
          tags: [],
        },
        strategy: mockStrategy,
      });

      expect(entity.owner_descriptions).toBeUndefined();
      expect(entity.item_expiration).toBeUndefined();
      expect(entity.fraudwarnings).toEqual([]);
      expect(entity.descriptions).toEqual([]);
      expect(entity.actions).toEqual([]);
    });
  });

  describe('Simple Getters', () => {
    it('should return the correct values', () => {
      const entity = SteamItemEntity.create({
        asset: mockAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
        tags: [],
      });

      expect(entity.getAppId()).toBe(mockAsset.appid);
      expect(entity.classid).toBe(mockAsset.classid);
      expect(entity.assetid).toBe(mockAsset.assetid);
      expect(entity.getInstanceId()).toBe(mockAsset.instanceid);
      expect(entity.getAmount()).toBe(Number(mockAsset.amount));
      expect(entity.contextid).toBe(mockAsset.contextid);
      expect(entity.tradable).toBe(Boolean(mockDescription.tradable));
      expect(entity.marketable).toBe(Boolean(mockDescription.marketable));
      expect(entity.commodity).toBe(Boolean(mockDescription.commodity));
      expect(entity.getMarketTradableRestriction()).toBe(
        mockDescription.market_tradable_restriction,
      );
      expect(entity.getMarketMarketableRestriction()).toBe(
        mockDescription.market_marketable_restriction,
      );
      expect(entity.market_hash_name).toBe(mockDescription.market_hash_name);
      expect(entity.background_color).toBe(mockDescription.background_color);
      expect(entity.getCurrency()).toBe(mockDescription.currency);
      expect(entity.icon_url).toBe(mockDescription.icon_url);
      expect(entity.icon_url_large).toBe(mockDescription.icon_url_large);
      expect(entity.market_name).toBe(mockDescription.market_name);
      expect(entity.type).toBe(mockDescription.type);
      expect(entity.name).toBe(mockDescription.name);
      expect(entity.tags).toEqual([]);
    });
  });
});
