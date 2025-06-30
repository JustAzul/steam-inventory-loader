import { DependencyContainer } from 'tsyringe';

import { registerApplicationDependencies } from '@application/application-dependency-container';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { registerInfraDependencies } from '@infra/infra-dependency-container';
import { registerPresentationDependencies } from '@presentation/presentation-dependency-container';

export function registerAllDependencies(
  container: DependencyContainer,
  config: LoaderConfig,
): void {
  registerApplicationDependencies(container);
  registerInfraDependencies(container, config);
  registerPresentationDependencies(container);
}
