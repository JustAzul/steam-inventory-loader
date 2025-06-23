import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import { CardType } from '@domain/types/card-type.type';
import { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { rawTag } from '@domain/types/raw-tag.type';

/**
 * Interface for Steam Inventory Loader
 * Provides methods for loading and processing Steam inventory data
 */
export default abstract class IAzulSteamInventoryLoader {
  /**
   * Sets a temporary configuration for the next `load` call.
   * @param config - A partial loader configuration.
   * @returns The loader instance for chaining.
   */
  abstract withConfig(config: Partial<LoaderConfig>): this;

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
