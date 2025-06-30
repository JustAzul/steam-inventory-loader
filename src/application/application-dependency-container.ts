import { DependencyContainer } from 'tsyringe';

import LoadInventoryUseCase from './use-cases/load-inventory.use-case';

export function registerApplicationDependencies(
  container: DependencyContainer,
): void {
  container.register(LoadInventoryUseCase, { useClass: LoadInventoryUseCase });
}
