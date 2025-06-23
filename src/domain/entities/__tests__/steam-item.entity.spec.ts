import { STEAM_CDN_IMAGE_URL } from '@domain/constants';
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageDescription } from '@domain/types/inventory-page-description.type';
import { SteamTag } from '@domain/types/steam-tag.type';

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
  });

  describe('getImageUrl', () => {
    const entity = SteamItemEntity.create({
      asset: mockAsset,
      description: { ...mockDescription, tags: [] },
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
      });
      const expectedUrl = `${STEAM_CDN_IMAGE_URL}/normal_icon.jpg`;
      expect(entityWithoutLargeIcon.getImageUrl('large')).toBe(expectedUrl);
    });
  });
}); 