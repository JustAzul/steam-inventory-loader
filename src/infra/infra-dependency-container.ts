import { DependencyContainer, instanceCachingFactory } from 'tsyringe';

import { DEFAULT_REQUEST_MAX_RETRIES } from '@application/constants';
import { IFetcher } from '@application/ports/fetcher.port';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { HttpClientFactory } from '@infra/factories/http-client.factory';

import { HttpClient } from './http-client';
import { HttpExceptionHandler } from './http-processing/chain/http-exception.handler';
import { HttpResponseValidationHandler } from './http-processing/chain/http-response-validation.handler';
import { SteamBodyValidationHandler } from './http-processing/chain/steam-body-validation.handler';
import { HttpResponseProcessor } from './http-processing/http-response-processor';
import { ResilientHttpFetcher } from './ResilientHttpFetcher';
import CookieParserService from './services/cookie-parser.service';

export function registerInfraDependencies(
  container: DependencyContainer,
  config: LoaderConfig,
): void {
  container.register('AxiosInstance', {
    useFactory: instanceCachingFactory(() =>
      HttpClientFactory.create({
        proxyAddress: config.proxyAddress,
      }),
    ),
  });

  container.register<IFetcher>('IFetcher', {
    useFactory: instanceCachingFactory(
      (c) =>
        new ResilientHttpFetcher(c.resolve(HttpClient), {
          maxRetries: config.maxRetries ?? DEFAULT_REQUEST_MAX_RETRIES,
        }),
    ),
  });

  container.register(CookieParserService, { useClass: CookieParserService });
  container.register(HttpClient, { useClass: HttpClient });
  container.register(HttpResponseProcessor, {
    useClass: HttpResponseProcessor,
  });
  container.register(HttpExceptionHandler, { useClass: HttpExceptionHandler });
  container.register(HttpResponseValidationHandler, {
    useClass: HttpResponseValidationHandler,
  });
  container.register(SteamBodyValidationHandler, {
    useClass: SteamBodyValidationHandler,
  });
}
