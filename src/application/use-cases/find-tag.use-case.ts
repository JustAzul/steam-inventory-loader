import SteamItemTag from '../../domain/entities/steam-item-tag.entity';
import { rawTag } from '../../domain/types/raw-tag.type';

export type FindTagUseCaseProps = {
  tags: Array<rawTag | SteamItemTag>;
  categoryToFind: string;
};

export default class FindTagUseCase {
  private readonly props: FindTagUseCaseProps;

  public constructor(props: Readonly<FindTagUseCaseProps>) {
    this.props = props;
  }

  public execute(): rawTag | SteamItemTag | null {
    const hasAtLeastOneTag = Boolean(this.props?.tags?.length);
    if (hasAtLeastOneTag === false) return null;

    const tag: rawTag | SteamItemTag | undefined = this.props.tags.find(
      ({ category }) => category === this.props.categoryToFind,
    );

    return tag ?? null;
  }
}
