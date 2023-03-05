import SteamItemTag from '../../domain/entities/steam-item-tag.entity';

export default class FindTagUseCase {
  public static execute(
    tags: SteamItemTag[],
    categoryToFind: string,
  ): SteamItemTag | null {
    if (tags.length === 0) return null;
    return tags.find(({ category }) => category === categoryToFind) ?? null;
  }
}
