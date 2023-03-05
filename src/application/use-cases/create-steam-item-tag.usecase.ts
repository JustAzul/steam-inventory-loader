import SteamItemTag from '../../domain/entities/steam-item-tag.entity';
import { SteamTag } from '../../domain/types/steam-tag.type';

export default class CreateSteamItemTagUseCase {
  public static execute(tag: SteamTag): SteamItemTag {
    return new SteamItemTag(tag);
  }
}
