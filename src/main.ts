import 'reflect-metadata';
import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { container } from 'tsyringe';

import { registerAllDependencies } from './dependency-container';
import { AzulSteamInventoryLoader } from './presentation/azul-steam-inventory-loader';

/**
 * Creates an instance of the Steam Inventory Loader.
 * This is the primary entry point for using the library.
 */
export function createInventoryLoader(
  config: LoaderConfig,
): IAzulSteamInventoryLoader {
  // Register global dependencies once
  registerAllDependencies(container);
  return new AzulSteamInventoryLoader(config);
}

// Export key types and entities for consumers of the library
export type { LoaderConfig } from '@domain/types/loader-config.type';
export { default as SteamItemEntity } from '@domain/entities/steam-item.entity';
export { default as SteamItemTag } from '@domain/entities/steam-item-tag.entity';
export type { CardType } from '@domain/types/card-type.type';
export type { rawTag } from '@domain/types/raw-tag.type';
export type { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
export { default as IAzulSteamInventoryLoader } from '@application/ports/azul-steam-inventory-loader.interface';
