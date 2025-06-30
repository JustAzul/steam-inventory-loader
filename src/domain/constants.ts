export const STEAM_CDN_IMAGE_URL =
  'https://steamcommunity-a.akamaihd.net/economy/image';

// Placeholder constants
export const PLACEHOLDER_APP_ID = '{appID}';
export const PLACEHOLDER_CONTEXT_ID = '{contextID}';
export const PLACEHOLDER_STEAM_ID_64 = '{steamID64}';

export const DEFAULT_REQUEST_URL = `https://steamcommunity.com/inventory/${PLACEHOLDER_STEAM_ID_64}/${PLACEHOLDER_APP_ID}/${PLACEHOLDER_CONTEXT_ID}`;

// Steam Application IDs
export const STEAM_APP_IDS = {
  COUNTER_STRIKE_2: 730,
  STEAM_COMMUNITY: 753,
} as const;

// Steam Context IDs
export const STEAM_CONTEXT_IDS = {
  COMMUNITY_ITEMS: '6',
  INVENTORY: '2',
} as const;

// Steam Market Hash Name Patterns
export const STEAM_MARKET_PATTERNS = {
  COMMUNITY_ITEM_PREFIX: /^(\d+)-/,
  STEAM_ERROR_FORMAT: /^(.+) \((\d+)\)$/,
  TRADABLE_AFTER: /^Tradable after:? /i,
} as const;
