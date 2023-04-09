export const STEAM_CDN_IMAGE_URL =
  'https://steamcommunity-a.akamaihd.net/economy/image';

export const DEFAULT_REQUEST_ITEM_COUNT = 75;
export const DEFAULT_REQUEST_LANGUAGE = 'english';
export const DEFAULT_REQUEST_MAX_RETRIES = 3;
export const DEFAULT_REQUEST_RETRY_DELAY = 1000;
export const DEFAULT_REQUEST_TIMEOUT = 1000 * 30; // 30 seconds

// Placeholder constants
export const PLACEHOLDER_APP_ID = '{appID}';
export const PLACEHOLDER_CONTEXT_ID = '{contextID}';
export const PLACEHOLDER_STEAM_ID_64 = '{steamID64}';

export const DEFAULT_REQUEST_URL = `https://steamcommunity.com/inventory/${PLACEHOLDER_STEAM_ID_64}/${PLACEHOLDER_APP_ID}/${PLACEHOLDER_CONTEXT_ID}`;
