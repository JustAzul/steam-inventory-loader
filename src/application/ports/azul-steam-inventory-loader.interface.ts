import { LoaderConfig } from '@domain/types/loader-config.type';

import { AzulInventoryResponse } from '../types/azul-inventory-response.type';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { IInventoryLoader } from './inventory-loader.interface';
import ILoaderUtils from './loader-utils.interface';

import SteamItemEntity from '@domain/entities/steam-item.entity';
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { CardType } from '@domain/types/card-type.type';
import { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
import { rawTag } from '@domain/types/raw-tag.type';

/**
 * Interface for Steam Inventory Loader
 * Provides methods for loading and processing Steam inventory data
 */
export default abstract class IAzulSteamInventoryLoader {
  /**
   * Loads a Steam inventory for the specified user and application
   */
  abstract load(
    steamID64: string,
    appID: string,
    contextID: string,
  ): Promise<SteamItemEntity[]>;

  /**
   * Finds a specific tag within a collection of tags
   */
  abstract getTag(
    tags: Array<rawTag | SteamItemTag>,
    categoryToFind: string,
  ): rawTag | SteamItemTag | null;

  /**
   * Generates the appropriate image URL for a Steam item
   */
  abstract getImageUrl(
    input: InputWithIconURL,
    size?: 'normal' | 'large',
  ): string;

  /**
   * Determines if a trading card is foil based on its tags
   */
  abstract isCardFoil(
    tags: Array<rawTag | SteamItemTag>,
  ): CardType | null;
}
