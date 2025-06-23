import 'reflect-metadata';
import { container } from 'tsyringe';

import { DEFAULT_REQUEST_MAX_RETRIES } from '@application/constants';
import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import { IFetcher } from '@application/ports/fetcher.port';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { PROXY_ADDRESS } from '@infra/constants';
import { HttpClient } from '@infra/http-client';
import { ResilientHttpFetcher } from '@infra/ResilientHttpFetcher';

import { registerAllDependencies } from './dependency-container';
import { AzulSteamInventoryLoader } from './presentation/azul-steam-inventory-loader';

/**
 * Creates an instance of the Steam Inventory Loader.
 * This is the primary entry point for using the library.
 */
export function createInventoryLoader(
  config: LoaderConfig,
): IAzulSteamInventoryLoader {
  const requestContainer = container.createChildContainer();
  registerAllDependencies(requestContainer);

  requestContainer.register(PROXY_ADDRESS, {
    useValue: config.proxyAddress || '',
  });
  requestContainer.register('AxiosInstance', {
    useValue: undefined,
  });
  requestContainer.register<IFetcher>('IFetcher', {
    useFactory: (c) =>
      new ResilientHttpFetcher(c.resolve(HttpClient), {
        maxRetries: config.maxRetries ?? DEFAULT_REQUEST_MAX_RETRIES,
      }),
  });

  return requestContainer.resolve(AzulSteamInventoryLoader);
}

// Export key types and entities for consumers of the library
export type { LoaderConfig } from '@domain/types/loader-config.type';
export { default as SteamItemEntity } from '@domain/entities/steam-item.entity';
export { default as SteamItemTag } from '@domain/entities/steam-item-tag.entity';
export type { CardType } from '@domain/types/card-type.type';
export type { rawTag } from '@domain/types/raw-tag.type';
export type { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
export { default as IAzulSteamInventoryLoader } from '@application/ports/azul-steam-inventory-loader.interface';
