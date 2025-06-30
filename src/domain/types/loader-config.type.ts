import type { CookieJar } from 'tough-cookie';

/**
 * @property {string} [language] - The language to use for the inventory. Defaults to 'en'.
 * @property {CookieJar} steamCommunityJar - The cookie jar with the steam community session.
 * @property {boolean} [tradableOnly] - Whether to only load tradable items. Defaults to true.
 * @property {number} [itemsPerPage] - The number of items to load per page. Defaults to 2000.
 */
export type LoaderConfig = {
  language?: string;
  steamCommunityJar: CookieJar;
  customEndpoint?: string;
  itemsPerPage?: number;
  maxRetries?: number;
  proxyAddress?: string;
  requestDelay?: number;
  steamApisKey?: string;
  steamSupplyKey?: string;
  tradableOnly?: boolean;
  useProxy?: boolean;
};
