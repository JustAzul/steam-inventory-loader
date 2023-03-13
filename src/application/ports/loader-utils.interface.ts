/* eslint-disable @typescript-eslint/no-unused-vars */
import { CardType } from '../../domain/types/card-type.type';
import { InputWithIconURL } from '../../domain/types/input-with-icon-url.type';
import { rawTag } from '../../domain/types/raw-tag.type';

export default abstract class ILoaderUtils {
  static getTag(tags: rawTag[], categoryToFind: string): rawTag | null {
    throw new Error('Not implemented');
  }

  static getLargeImageURL(inputWithIconUrl: InputWithIconURL): string {
    throw new Error('Not implemented');
  }

  static getImageURL(
    inputWithIconUrl: Pick<InputWithIconURL, 'icon_url'>,
  ): string {
    throw new Error('Not implemented');
  }

  static isCardType(tags?: rawTag[]): false | CardType {
    throw new Error('Not implemented');
  }
}
