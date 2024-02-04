import { CookieJar, JarLike } from '../../domain/types/cookie-jar.type';
import { LoaderResponse } from '../types/loader-response.type';

export interface IInventoryLoader {
  readonly appID: string | number;

  readonly contextID: string | number;

  readonly language: string;

  loadInventory(): Promise<LoaderResponse>;

  readonly maxRetries: number;

  readonly steamCommunityJar: CookieJar | JarLike | null;

  readonly steamID64: string;
}
