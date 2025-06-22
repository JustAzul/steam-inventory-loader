import FindCardBorderTypeUseCase from '@application/use-cases/find-card-border-type.use-case';
import FindTagUseCase from '@application/use-cases/find-tag.use-case';
import GetImageUrlUseCase from '@application/use-cases/get-image-url.use-case';
import {
  InputWithIconUrl,
  SteamTag,
} from '@domain/types/inventory-page-description.type';
import { Cookie } from '@domain/types/cookie.type';
import { CookieJar } from 'tough-cookie';
import ILoaderUtils from '@application/ports/loader-utils.interface';
import { rawTag } from '@domain/types/raw-tag.type';

export function parseCookies(jarLikeInput?: CookieJar): string[] {
  if (!jarLikeInput) return [];

  // eslint-disable-next-line no-underscore-dangle
  if ('_jar' in jarLikeInput) return parseCookies(jarLikeInput._jar as CookieJar);

  const result = (jarLikeInput.serializeSync().cookies as Cookie[])
    .filter(({ domain }) => domain === 'steamcommunity.com')
    .map(({ key, value }) => `${key}=${value};`);

  return result;
}

export function getTags(
  ...args: Parameters<typeof ILoaderUtils.getTag>
): ReturnType<typeof ILoaderUtils.getTag> {
  const [tags, categoryToFind] = args;
  const result = new FindTagUseCase({ categoryToFind, tags }).execute();
  return result as rawTag | null;
}

export function getLargeImageURL(
  ...args: Parameters<typeof ILoaderUtils.getLargeImageURL>
): ReturnType<typeof ILoaderUtils.getLargeImageURL> {
  const [input] = args;
  const result: string = new GetImageUrlUseCase({
    input,
    size: 'large',
  }).execute();

  return result;
}

export function getImageURL(
  ...args: Parameters<typeof ILoaderUtils.getImageURL>
): ReturnType<typeof ILoaderUtils.getImageURL> {
  const [input] = args;
  const result: string = new GetImageUrlUseCase({
    input,
    size: 'normal',
  }).execute();

  return result;
}

export function isCardType(
  ...args: Parameters<typeof ILoaderUtils.isCardType>
): ReturnType<typeof ILoaderUtils.isCardType> {
  const [tags] = args;
  if (!tags || !tags.length) return false;

  const result = new FindCardBorderTypeUseCase({ tags }).execute();
  const hasFoundResult = result !== null;

  if (hasFoundResult) {
    return result;
  }

  return false;
}
