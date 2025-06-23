import SteamItemEntity from '@domain/entities/steam-item.entity';
import { CookieJar, JarLike } from '@domain/types/cookie-jar.type';

export interface IInventoryLoader {
  readonly appID: string | number;

  readonly contextID: string | number;

  readonly language: string;

  loadInventory(): Promise<SteamItemEntity[]>;

  readonly maxRetries: number;

  readonly steamCommunityJar: CookieJar | JarLike | null;

  readonly steamID64: string;
}
