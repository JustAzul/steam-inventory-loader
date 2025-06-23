import { DependencyContainer } from 'tsyringe';

import HttpConfigurationService from './application/services/http-configuration.service';
import InventoryPageService from './application/services/inventory-page.service';
import SteamInventoryService from './application/services/steam-inventory.service';
import FindCardBorderTypeUseCase from './application/use-cases/find-card-border-type.use-case';
import FindTagUseCase from './application/use-cases/find-tag.use-case';
import GetImageUrlUseCase from './application/use-cases/get-image-url.use-case';
import GetInventoryPageResultUseCase from './application/use-cases/get-inventory-page-result.use-case';
import GetItemCacheExpirationUseCase from './application/use-cases/get-item-cache-expiration.use-case';
import GetItemMarketFeeAppUseCase from './application/use-cases/get-item-market-fee-app.use-case';
import GetPageUrlUseCase from './application/use-cases/get-page-url.use-case';
import { HttpProcessingChainUseCase } from './application/use-cases/http-processing-chain.use-case';
import { HttpExceptionHandler } from './application/use-cases/http-processing-chain/http-exception.handler';
import { HttpResponseValidationHandler } from './application/use-cases/http-processing-chain/http-response-validation.handler';
import { SteamBodyValidationHandler } from './application/use-cases/http-processing-chain/steam-body-validation.handler';
import LoadInventoryUseCase from './application/use-cases/load-inventory.use-case';
import MapAssetsToSteamItemsUseCase from './application/use-cases/map-assets-to-steam-items.use-case';
import ValidateEndpointUseCase from './application/use-cases/validate-endpoint.use-case';
import CookieParserService from './domain/services/cookie-parser.service';
import { HttpClient } from './infra/http-client';

export function registerAllDependencies(c: DependencyContainer): void {
  c.registerSingleton(SteamInventoryService);
  c.registerSingleton(LoadInventoryUseCase);
  c.registerSingleton(MapAssetsToSteamItemsUseCase);
  c.registerSingleton(InventoryPageService);
  c.registerSingleton(GetInventoryPageResultUseCase);
  c.registerSingleton(GetPageUrlUseCase);
  c.registerSingleton(CookieParserService);
  c.registerSingleton(HttpClient);
  c.registerSingleton(ValidateEndpointUseCase);
  c.registerSingleton(HttpConfigurationService);
  c.registerSingleton(FindTagUseCase);
  c.registerSingleton(GetImageUrlUseCase);
  c.registerSingleton(FindCardBorderTypeUseCase);
  c.registerSingleton(GetItemCacheExpirationUseCase);
  c.registerSingleton(GetItemMarketFeeAppUseCase);
  c.registerSingleton(HttpProcessingChainUseCase);
  c.registerSingleton(HttpExceptionHandler);
  c.registerSingleton(HttpResponseValidationHandler);
  c.registerSingleton(SteamBodyValidationHandler);
} 