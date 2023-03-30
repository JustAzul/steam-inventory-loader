import SteamItemTag from '../../domain/entities/steam-item-tag.entity';
import { rawTag } from '../../domain/types/raw-tag.type';

export type FindTagUseCaseProps = {
  tags: Array<rawTag | SteamItemTag>;
  categoryToFind: string;
};

export default class FindTagUseCase {
  public static execute(
    props: Readonly<FindTagUseCaseProps>,
  ): rawTag | SteamItemTag | null {
    const hasAtLeastOneTag = Boolean(props?.tags?.length);
    if (hasAtLeastOneTag === false) return null;

    const tag: rawTag | SteamItemTag | undefined = props.tags.find(
      ({ category }) => category === props.categoryToFind,
    );

    return tag ?? null;
  }
}
