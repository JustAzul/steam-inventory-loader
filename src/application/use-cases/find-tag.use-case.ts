import { injectable } from 'tsyringe';

import { Tag } from '@domain/types/tag.interface';

export type FindTagUseCaseProps = {
  categoryToFind: string;
  tags: Tag[];
};

@injectable()
export default class FindTagUseCase {
  public execute({ tags, categoryToFind }: FindTagUseCaseProps): Tag | null {
    const hasAtLeastOneTag = Boolean(tags?.length);
    if (hasAtLeastOneTag === false) return null;

    const tag: Tag | undefined = tags.find(
      ({ category }) => category === categoryToFind,
    );

    return tag ?? null;
  }
}
