/* eslint-disable @typescript-eslint/no-unused-vars */
import AzulInventoryResponse from '../../domain/entities/azul-inventory-response.entity';
import { CardType } from '../../domain/types/card-type.type';
import { IInventoryLoader } from './inventory-loader.interface';
import { InputWithIconURL } from '../../domain/types/input-with-icon-url.type';
import { OptionalConfig } from '../../domain/types/optional-config.type';
import { rawTag } from '../../domain/types/raw-tag.type';

export default abstract class IAzulSteamInventoryLoader {
  static readonly InventoryLoader: IInventoryLoader;

  static Loader(
    SteamID64: string,
    appID: string | number,
    contextID: string | number,
    optionalConfig?: OptionalConfig,
  ): Promise<AzulInventoryResponse> {
    throw new Error('Not implemented');
  }

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
