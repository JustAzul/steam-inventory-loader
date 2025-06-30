import { DependencyContainer } from 'tsyringe';

import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';

import { AzulSteamInventoryLoader } from './azul-steam-inventory-loader';

export function registerPresentationDependencies(
  container: DependencyContainer,
): void {
  container.register<IAzulSteamInventoryLoader>('IAzulSteamInventoryLoader', {
    useClass: AzulSteamInventoryLoader,
  });
}
