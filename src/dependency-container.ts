import { DependencyContainer } from 'tsyringe';

import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import { IInventoryPageService } from '@application/ports/inventory-page-service.interface';

import InventoryPageService from './application/services/inventory-page.service';
import GetInventoryPageResultUseCase from './application/use-cases/get-inventory-page-result.use-case';
import GetItemCacheExpirationUseCase from './application/use-cases/get-item-cache-expiration.use-case';
import GetItemMarketFeeAppUseCase from './application/use-cases/get-item-market-fee-app.use-case';
import GetPageUrlUseCase from './application/use-cases/get-page-url.use-case';
import LoadInventoryUseCase from './application/use-cases/load-inventory.use-case';
import { HttpExceptionHandler } from './application/use-cases/http-processing-chain/http-exception.handler';
import { HttpResponseValidationHandler } from './application/use-cases/http-processing-chain/http-response-validation.handler';
import { SteamBodyValidationHandler } from './application/use-cases/http-processing-chain/steam-body-validation.handler';
import { HttpProcessingChainUseCase } from './application/use-cases/http-processing-chain.use-case';
import ValidateEndpointUseCase from './application/use-cases/validate-endpoint.use-case';
import { HttpClient } from './infra/http-client';
import CookieParserService from './infra/services/cookie-parser.service';
import { AzulSteamInventoryLoader } from './presentation/azul-steam-inventory-loader';

export function registerAllDependencies(c: DependencyContainer): void {
  c.register<IAzulSteamInventoryLoader>('IAzulSteamInventoryLoader', {
    useClass: AzulSteamInventoryLoader,
  });
  c.register<IInventoryPageService>('IInventoryPageService', {
    useClass: InventoryPageService,
  });
  c.register(LoadInventoryUseCase, { useClass: LoadInventoryUseCase });
  c.register(InventoryPageService, { useClass: InventoryPageService });
  c.register(GetInventoryPageResultUseCase, {
    useClass: GetInventoryPageResultUseCase,
  });
  c.register(GetPageUrlUseCase, { useClass: GetPageUrlUseCase });
  c.register(CookieParserService, { useClass: CookieParserService });
  c.register(HttpClient, { useClass: HttpClient });
  c.register(ValidateEndpointUseCase, { useClass: ValidateEndpointUseCase });
  c.register(GetItemCacheExpirationUseCase, {
    useClass: GetItemCacheExpirationUseCase,
  });
  c.register(GetItemMarketFeeAppUseCase, {
    useClass: GetItemMarketFeeAppUseCase,
  });
  c.register(HttpProcessingChainUseCase, {
    useClass: HttpProcessingChainUseCase,
  });
  c.register(HttpExceptionHandler, { useClass: HttpExceptionHandler });
  c.register(HttpResponseValidationHandler, {
    useClass: HttpResponseValidationHandler,
  });
  c.register(SteamBodyValidationHandler, {
    useClass: SteamBodyValidationHandler,
  });
} 