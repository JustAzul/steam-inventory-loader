import { injectable, inject } from 'tsyringe';
import SteamItemTag from '../../domain/entities/steam-item-tag.entity';
import { CardType } from '../../domain/types/card-type.type';
import FindTagUseCase from './find-tag.use-case';
import { rawTag } from '@domain/types/raw-tag.type';

// eslint-disable-next-line no-shadow
enum CardBorderInternalName {
  Foil = 'cardborder_1',
  Normal = 'cardborder_0',
}

export type FindCardBorderTypeProps = {
  tags: Array<rawTag | SteamItemTag>;
};

@injectable()
export default class FindCardBorderTypeUseCase {
  public constructor(
    @inject(FindTagUseCase) private readonly findTagUseCase: FindTagUseCase,
  ) {}

  public execute({ tags }: FindCardBorderTypeProps): CardType | null {
    const itemClass = this.findTagUseCase.execute({
      tags,
      categoryToFind: 'item_class',
    });

    if (itemClass && itemClass.internal_name === 'item_class_2') {
      const cardBorder = this.findTagUseCase.execute({
        tags,
        categoryToFind: 'cardborder',
      });

      if (cardBorder) {
        if (cardBorder.internal_name === CardBorderInternalName.Normal)
          return 'Normal';

        if (cardBorder.internal_name === CardBorderInternalName.Foil)
          return 'Foil';
      }
    }

    return null;
  }
}
