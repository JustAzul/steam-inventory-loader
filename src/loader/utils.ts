import type { Cookie } from './types/cookie.type';
import type { InventoryLoaderConstructor } from './types/inventory-loader-constructor.type';

export default class LoaderUtils {
  public static parseCookies(
    jarLikeInput?: InventoryLoaderConstructor['steamCommunityJar'],
  ): string[] {
    if (!jarLikeInput) return [];

    if ('_jar' in jarLikeInput) {
      // eslint-disable-next-line no-underscore-dangle
      return LoaderUtils.parseCookies(jarLikeInput._jar);
    }

    const result = (jarLikeInput.serializeSync().cookies as Cookie[])
      .filter(({ domain }) => domain === 'steamcommunity.com')
      .map(({ key, value }) => `${key}=${value};`);

    return result;
  }
}
