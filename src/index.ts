import AzulSteamInventoryLoader from './infra/main';
import { LoaderConfig } from '@domain/types/loader-config.type';

/**
 * Creates an instance of the Steam Inventory Loader.
 *
 * @param config - The configuration object for the loader.
 * @param config.SteamCommunity_Jar - A `tough-cookie` CookieJar instance containing valid `sessionid` and `steamLoginSecure` cookies for steamcommunity.com.
 * @param config.language - The language for item descriptions (e.g., 'english').
 * @param config.itemsPerPage - The number of items to fetch per page (max 5000).
 * @param config.requestDelay - The delay in milliseconds between requests.
 * @param config.proxyAddress - The address of a proxy to use for requests.
 * @param config.maxRetries - The maximum number of retries for a failed request.
 *
 * @returns An instance of the AzulSteamInventoryLoader.
 *
 * @example
 * ```
 * import { CookieJar } from 'tough-cookie';
 * import createInventoryLoader from 'azul-steam-inventory-loader';
 *
 * const cookieJar = new CookieJar();
 * cookieJar.setCookie('sessionid=YOUR_SESSION_ID', 'https://steamcommunity.com');
 * cookieJar.setCookie('steamLoginSecure=YOUR_LOGIN_SECURE_TOKEN', 'https://steamcommunity.com');
 *
 * const config = { SteamCommunity_Jar: cookieJar };
 * const loader = createInventoryLoader(config);
 *
 * // To load an inventory:
 * // const inventory = await loader.load('76561197994150794', '730', '2');
 * // console.log(inventory);
 * ```
 */
export default function createInventoryLoader(config: LoaderConfig) {
  return new AzulSteamInventoryLoader(config);
}

// For backward compatibility, we can still export the class.
export { AzulSteamInventoryLoader };
