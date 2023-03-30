import { rawTag } from '../../domain/types/raw-tag.type';

export type FindTagUseCaseProps = {
  tags: rawTag[];
  categoryToFind: string;
};

export default class FindTagUseCase {
  public static execute(props: Readonly<FindTagUseCaseProps>): rawTag | null {
    const hasAtLeastOneTag = Boolean(props?.tags?.length);
    if (hasAtLeastOneTag === false) return null;

    const tag: rawTag | undefined = props.tags.find(
      ({ category }) => category === props.categoryToFind,
    );

    return tag ?? null;
  }
}
