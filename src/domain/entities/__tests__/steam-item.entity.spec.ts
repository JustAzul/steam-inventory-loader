import { STEAM_CDN_IMAGE_URL } from '@domain/constants';
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
    appid: 730,
    contextid: '2',
    assetid: '12345',
    classid: '54321',
    instanceid: '1',
    amount: '1',
  };

  const mockDescription: Omit<InventoryPageDescription, 'tags'> = {
    appid: 730,
    classid: '54321',
    instanceid: '1',
    currency: 0,
    background_color: '',
    descriptions: [],
    tradable: 1,
    actions: [],
    name: 'Test Item',
    type: 'Base',
    market_name: 'Test Item',
    market_hash_name: 'Test Item',
    commodity: 0,
    market_tradable_restriction: 0,
    market_marketable_restriction: 0,
    marketable: 1,
    market_fee_app: 730,
    icon_url: 'normal_icon.jpg',
    icon_url_large: 'large_icon.jpg',
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
      internal_name: 'item_class_2',
      name: 'Trading Card',
      category_name: 'Item Class',
      color: '',
      localized_tag_name: 'Trading Card',
    },
    {
      category: 'cardborder',
      internal_name: 'cardborder_0',
      name: 'Normal',
      category_name: 'Card Border',
      color: '',
      localized_tag_name: 'Normal',
    },
  ];

  const foilCardTags: SteamTag[] = [
    {
      category: 'item_class',
      internal_name: 'item_class_2',
      name: 'Trading Card',
      category_name: 'Item Class',
      color: '',
      localized_tag_name: 'Trading Card',
    },
    {
      category: 'cardborder',
      internal_name: 'cardborder_1',
      name: 'Foil',
      category_name: 'Card Border',
      color: '',
      localized_tag_name: 'Foil',
    },
  ];

  const nonCardTags: SteamTag[] = [
    {
      category: 'item_class',
      internal_name: 'item_class_3',
      name: 'Profile Background',
      category_name: 'Item Class',
      color: '',
      localized_tag_name: 'Profile Background',
    },
    {
      category: 'cardborder',
      internal_name: 'cardborder_0',
      name: 'Normal',
      category_name: 'Card Border',
      color: '',
      localized_tag_name: 'Normal',
    },
  ];

  const missingBorderTag: SteamTag[] = [
    {
      category: 'item_class',
      internal_name: 'item_class_2',
      name: 'Trading Card',
      category_name: 'Item Class',
      color: '',
      localized_tag_name: 'Trading Card',
    },
  ];

  describe('getCardBorderType', () => {
    it('should return "Normal" for a normal trading card', () => {
      const entity = createEntityWithTags(normalCardTags);
      expect(entity.getCardBorderType()).toBe('Normal');
    });

    it('should return "Foil" for a foil trading card', () => {
      const entity = createEntityWithTags(foilCardTags);
      expect(entity.getCardBorderType()).toBe('Foil');
    });

    it('should return null if it is not a trading card (wrong item_class)', () => {
      const entity = createEntityWithTags(nonCardTags);
      expect(entity.getCardBorderType()).toBeNull();
    });

    it('should return null if it is a trading card but has no border tag', () => {
      const entity = createEntityWithTags(missingBorderTag);
      expect(entity.getCardBorderType()).toBeNull();
    });

    it('should return null for an empty tags array', () => {
      const entity = createEntityWithTags([]);
      expect(entity.getCardBorderType()).toBeNull();
    });

    it('should return null for a trading card with an unknown border type', () => {
      const unknownBorderTags: SteamTag[] = [
        {
          category: 'item_class',
          internal_name: 'item_class_2',
          name: 'Trading Card',
          category_name: 'Item Class',
          color: '',
          localized_tag_name: 'Trading Card',
        },
        {
          category: 'cardborder',
          internal_name: 'cardborder_2',
          name: 'Unknown',
          category_name: 'Card Border',
          color: '',
          localized_tag_name: 'Unknown',
        },
      ];
      const entity = createEntityWithTags(unknownBorderTags);
      expect(entity.getCardBorderType()).toBeNull();
    });
  });

  describe('getImageUrl', () => {
    const entity = SteamItemEntity.create({
      asset: mockAsset,
      description: { ...mockDescription, tags: [] },
      strategy: mockStrategy,
    });

    it('should return the normal icon_url when size is not specified', () => {
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/normal_icon.jpg`;
      expect(entity.getImageUrl()).toBe(expectedUrl);
    });

    it('should return the normal icon_url when size is "normal"', () => {
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/normal_icon.jpg`;
      expect(entity.getImageUrl('normal')).toBe(expectedUrl);
    });

    it('should return the large icon_url when size is "large"', () => {
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/large_icon.jpg`;
      expect(entity.getImageUrl('large')).toBe(expectedUrl);
    });

    it('should fall back to normal icon_url when size is "large" but icon_url_large is missing', () => {
      const descriptionWithoutLargeIcon = { ...mockDescription, tags: [], icon_url_large: '' };
      const entityWithoutLargeIcon = SteamItemEntity.create({
        asset: mockAsset,
        description: descriptionWithoutLargeIcon,
        strategy: mockStrategy,
      });
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/normal_icon.jpg`;
      expect(entityWithoutLargeIcon.getImageUrl('large')).toBe(expectedUrl);
    });
  });

  describe('getCacheExpiration', () => {
    it('should delegate the call to the injected strategy', () => {
      const entity = SteamItemEntity.create({
        asset: mockAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
      });
      const expectedDate = new Date().toISOString();
      (mockStrategy.getCacheExpiration as jest.Mock).mockReturnValueOnce(
        expectedDate,
      );

      const result = entity.getCacheExpiration();

      expect(mockStrategy.getCacheExpiration).toHaveBeenCalledWith(entity);
      expect(result).toBe(expectedDate);
    });
  });

  describe('getMarketFeeApp', () => {
    it('should delegate the call to the injected strategy', () => {
      const entity = SteamItemEntity.create({
        asset: mockAsset,
        description: { ...mockDescription, tags: [] },
        strategy: mockStrategy,
      });
      const expectedFee = 123;
      (mockStrategy.getMarketFeeApp as jest.Mock).mockReturnValueOnce(expectedFee);

      const result = entity.getMarketFeeApp();

      expect(mockStrategy.getMarketFeeApp).toHaveBeenCalledWith(entity);
      expect(result).toBe(expectedFee);
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