import { LoadInventoryPageUseCaseProps } from '@application/use-cases/load-inventory.use-case';

import SteamItemEntity from '@domain/entities/steam-item.entity';

/**
 * Interface for Steam Inventory Loader
 * Provides methods for loading and processing Steam inventory data
 */
export default abstract class IAzulSteamInventoryLoader {
  /**
   * Loads a Steam inventory for the specified user and application
   */
  abstract load(props: LoadInventoryPageUseCaseProps): Promise<SteamItemEntity[]>;
}
