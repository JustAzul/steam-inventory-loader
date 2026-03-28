import type { Tag, ItemDetails } from '../types.js';

const DEFAULT_STEAM_IMAGE_URL = 'https://steamcommunity-a.akamaihd.net/economy/image/';

/**
 * Get a tag by category from tags array (FR42).
 */
export function getTag(tags: Tag[] | undefined, category: string): Tag | null {
  if (!tags) return null;
  return tags.find(t => t.category === category) ?? null;
}

/**
 * Get the full image URL for an item (FR43).
 */
export function getImageURL(item: Pick<ItemDetails, 'icon_url'>): string {
  return DEFAULT_STEAM_IMAGE_URL + item.icon_url;
}

/**
 * Get the large image URL, falling back to icon_url (FR44).
 */
export function getLargeImageURL(item: Pick<ItemDetails, 'icon_url' | 'icon_url_large'>): string {
  return DEFAULT_STEAM_IMAGE_URL + (item.icon_url_large || item.icon_url);
}

/**
 * Detect card type from tags: 'Normal', 'Foil', or null (FR45).
 * Requires item_class_2 (Trading Card) + cardborder_0 (Normal) or cardborder_1 (Foil).
 */
export function isCardType(tags: Tag[] | undefined): 'Normal' | 'Foil' | null {
  if (!tags) return null;

  const hasCardClass = tags.some(t =>
    t.category === 'item_class' && t.internal_name === 'item_class_2',
  );
  if (!hasCardClass) return null;

  const border = tags.find(t => t.category === 'cardborder');
  if (!border) return null;

  if (border.internal_name === 'cardborder_0') return 'Normal';
  if (border.internal_name === 'cardborder_1') return 'Foil';
  return null;
}
