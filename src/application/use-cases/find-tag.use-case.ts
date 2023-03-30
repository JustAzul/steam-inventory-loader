import { rawTag } from '../../domain/types/raw-tag.type';

export default class FindTagUseCase {
  public static execute(
    tags: Readonly<rawTag>[],
    categoryToFind: string,
  ): rawTag | null {
    if (tags.length === 0) return null;
    return tags.find(({ category }) => category === categoryToFind) ?? null;
  }
}
