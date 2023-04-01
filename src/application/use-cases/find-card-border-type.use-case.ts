import { CardType } from '../../domain/types/card-type.type';
import SteamItemTag from '../../domain/entities/steam-item-tag.entity';

// eslint-disable-next-line no-shadow
enum CardBorderInternalName {
  Normal = 'cardborder_0',
  Foil = 'cardborder_1',
}

export type FindCardBorderTypeProps = {
  tags: Readonly<Pick<SteamItemTag, 'internal_name' | 'category'>>[];
};

export default class FindCardBorderTypeUseCase {
  private readonly props: FindCardBorderTypeProps;

  public constructor(props: Readonly<FindCardBorderTypeProps>) {
    this.props = props;
  }

  public execute(): CardType | null {
    const { tags } = this.props;

    const itemClass = FindCardBorderTypeUseCase.InternalFindTag(
      tags,
      'item_class',
    );

    if (itemClass && itemClass.internal_name === 'item_class_2') {
      const cardBorder = FindCardBorderTypeUseCase.InternalFindTag(
        tags,
        'cardborder',
      );

      if (cardBorder) {
        if (cardBorder.internal_name === CardBorderInternalName.Normal)
          return 'Normal';

        if (cardBorder.internal_name === CardBorderInternalName.Foil)
          return 'Foil';
      }
    }

    return null;
  }

  private static InternalFindTag(
    tags: Readonly<Pick<SteamItemTag, 'internal_name' | 'category'>[]>,
    categoryToFind: string,
  ): Pick<SteamItemTag, 'internal_name' | 'category'> | null {
    if (tags.length === 0) return null;

    const tag = tags.find(({ category }) => category === categoryToFind);
    if (tag) return tag;

    return null;
  }
}
