import { CardType } from '../../domain/types/card-type.type';
import FindTagUseCase from './find-tag.usecase';
import SteamItemTag from '../../domain/entities/steam-item-tag.entity';

export default class FindCardBorderTypeUseCase {
  public static execute(tags: SteamItemTag[]): CardType | null {
    const itemClass = FindTagUseCase.execute(tags, 'item_class');

    if (itemClass && itemClass.internal_name === 'item_class_2') {
      const cardBorder = FindTagUseCase.execute(tags, 'cardborder');

      if (cardBorder) {
        if (cardBorder.internal_name === 'cardborder_0') return 'Normal';
        if (cardBorder.internal_name === 'cardborder_1') return 'Foil';
      }
    }

    return null;
  }
}
