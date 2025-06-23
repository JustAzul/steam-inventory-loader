
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { rawTag } from '@domain/types/raw-tag.type';
import { injectable } from 'tsyringe';

export type FindTagUseCaseProps = {
  categoryToFind: string;
  tags: Array<rawTag | SteamItemTag>;
};

@injectable()
export default class FindTagUseCase {
  public execute({
    tags,
    categoryToFind,
  }: FindTagUseCaseProps): rawTag | SteamItemTag | null {
    const hasAtLeastOneTag = Boolean(tags?.length);
    if (hasAtLeastOneTag === false) return null;

    const tag: rawTag | SteamItemTag | undefined = tags.find(
      ({ category }) => category === categoryToFind,
    );

    return tag ?? null;
  }
}
