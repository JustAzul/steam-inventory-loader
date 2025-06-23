import { DependencyContainer, instanceCachingFactory } from 'tsyringe';

import { DEFAULT_REQUEST_MAX_RETRIES } from '@application/constants';
import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import { IFetcher } from '@application/ports/fetcher.port';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { PROXY_ADDRESS } from '@infra/constants';

import LoadInventoryUseCase from './application/use-cases/load-inventory.use-case';
import { HttpClient } from './infra/http-client';
import { HttpExceptionHandler } from './infra/http-processing/chain/http-exception.handler';
import { HttpResponseValidationHandler } from './infra/http-processing/chain/http-response-validation.handler';
import { SteamBodyValidationHandler } from './infra/http-processing/chain/steam-body-validation.handler';
import { HttpResponseProcessor } from './infra/http-processing/http-response-processor';
import { ResilientHttpFetcher } from './infra/ResilientHttpFetcher';
import CookieParserService from './infra/services/cookie-parser.service';
import { AzulSteamInventoryLoader } from './presentation/azul-steam-inventory-loader';

export function registerAllDependencies(
  c: DependencyContainer,
  config: LoaderConfig,
): void {
  c.register<IAzulSteamInventoryLoader>('IAzulSteamInventoryLoader', {
    useClass: AzulSteamInventoryLoader,
  });

  c.register<IFetcher>('IFetcher', {
    useFactory: instanceCachingFactory(
      (con) =>
        new ResilientHttpFetcher(con.resolve(HttpClient), {
          maxRetries: config.maxRetries ?? DEFAULT_REQUEST_MAX_RETRIES,
        }),
    ),
  });

  c.register(PROXY_ADDRESS, {
    useValue: config.proxyAddress || '',
  });
  c.register('AxiosInstance', {
    useValue: undefined,
  });

  c.register(LoadInventoryUseCase, { useClass: LoadInventoryUseCase });
  c.register(CookieParserService, { useClass: CookieParserService });
  c.register(HttpClient, { useClass: HttpClient });
  c.register(HttpResponseProcessor, {
    useClass: HttpResponseProcessor,
  });
  c.register(HttpExceptionHandler, { useClass: HttpExceptionHandler });
  c.register(HttpResponseValidationHandler, {
    useClass: HttpResponseValidationHandler,
  });
  c.register(SteamBodyValidationHandler, {
    useClass: SteamBodyValidationHandler,
  });
} 