export const STEAM_CDN_IMAGE_URL =
  'https://steamcommunity-a.akamaihd.net/economy/image';

export const DEFAULT_REQUEST_ITEM_COUNT = 75;
export const DEFAULT_REQUEST_LANGUAGE = 'english';
export const DEFAULT_REQUEST_MAX_RETRIES = 5;
export const DEFAULT_REQUEST_RETRY_DELAY = 5000;
export const DEFAULT_REQUEST_TIMEOUT = 30000;

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
  INVENTORY: '2',
  COMMUNITY_ITEMS: '6',
} as const;

// Steam Market Hash Name Patterns
export const STEAM_MARKET_PATTERNS = {
  COMMUNITY_ITEM_PREFIX: /^(\d+)-/,
  STEAM_ERROR_FORMAT: /^(.+) \((\d+)\)$/,
  TRADABLE_AFTER: /^Tradable After /,
} as const;
