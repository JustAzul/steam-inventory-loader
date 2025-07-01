import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { SteamItemLogicService } from '@domain/services/steam-item-logic.service';
import { IAppSpecificLogic } from '@domain/strategies/app-specific/IAppSpecificLogic';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';
import { SteamTag } from '@domain/types/steam-tag.type';

const mockStrategy: IAppSpecificLogic = {
  getCacheExpiration: jest.fn(),
  getMarketFeeApp: jest.fn(),
};

describe('Domain :: Services :: SteamItemLogicService', () => {
  let service: SteamItemLogicService;

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
      internal_name: 'item_class_6',
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

  const foilCardTags: SteamTag[] = [
    {
      category: 'item_class',
      category_name: 'Item Class',
      color: '',
      internal_name: 'item_class_6',
      localized_tag_name: 'Trading Card',
      name: 'Trading Card',
    },
    {
      category: 'cardborder',
      category_name: 'Card Border',
      color: '',
      internal_name: 'cardborder_1',
      localized_tag_name: 'Foil',
      name: 'Foil',
    },
  ];

  const nonCardTags: SteamTag[] = [
    {
      category: 'item_class',
      category_name: 'Item Class',
      color: '',
      internal_name: 'item_class_3',
      localized_tag_name: 'Profile Background',
      name: 'Profile Background',
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

  const missingBorderTag: SteamTag[] = [
    {
      category: 'item_class',
      category_name: 'Item Class',
      color: '',
      internal_name: 'item_class_6',
      localized_tag_name: 'Trading Card',
      name: 'Trading Card',
    },
  ];

  beforeEach(() => {
    service = new SteamItemLogicService();
    jest.clearAllMocks();
  });

  describe('getCardType', () => {
    it('should return "Normal" for a normal trading card', () => {
      const entity = createEntityWithTags(normalCardTags);
      expect(service.getCardType(entity)).toBe('Normal');
    });

    it('should return "Foil" for a foil trading card', () => {
      const entity = createEntityWithTags(foilCardTags);
      expect(service.getCardType(entity)).toBe('Foil');
    });

    it('should return undefined if it is not a trading card (wrong item_class)', () => {
      const entity = createEntityWithTags(nonCardTags);
      expect(service.getCardType(entity)).toBeUndefined();
    });

    it('should return undefined if it is a trading card but has no border tag', () => {
      const entity = createEntityWithTags(missingBorderTag);
      expect(service.getCardType(entity)).toBeUndefined();
    });

    it('should return undefined for an empty tags array', () => {
      const entity = createEntityWithTags([]);
      expect(service.getCardType(entity)).toBeUndefined();
    });

    it('should return undefined for a trading card with an unknown border type', () => {
      const unknownBorderTags: SteamTag[] = [
        {
          category: 'item_class',
          category_name: 'Item Class',
          color: '',
          internal_name: 'item_class_6',
          localized_tag_name: 'Trading Card',
          name: 'Trading Card',
        },
        {
          category: 'cardborder',
          category_name: 'Card Border',
          color: '',
          internal_name: 'cardborder_2',
          localized_tag_name: 'Unknown',
          name: 'Unknown',
        },
      ];
      const entity = createEntityWithTags(unknownBorderTags);
      expect(service.getCardType(entity)).toBeUndefined();
    });
  });

  describe('getCacheExpiration', () => {
    it('should call the strategy to get the cache expiration date', () => {
      const entity = createEntityWithTags([]);
      (mockStrategy.getCacheExpiration as jest.Mock).mockReturnValueOnce(
        '2023-01-01',
      );

      const result = service.getCacheExpiration(entity);

      expect(result).toBe('2023-01-01');
      expect(mockStrategy.getCacheExpiration).toHaveBeenCalledWith(entity);
    });
  });

  describe('getMarketFeeApp', () => {
    it('should call the strategy to get the market fee app', () => {
      const entity = createEntityWithTags([]);
      const expectedFee = 440;
      (mockStrategy.getMarketFeeApp as jest.Mock).mockReturnValueOnce(
        expectedFee,
      );

      const result = service.getMarketFeeApp(entity);

      expect(result).toBe(expectedFee);
      expect(mockStrategy.getMarketFeeApp).toHaveBeenCalledWith(entity);
    });
  });
});
