import 'reflect-metadata';
import { container } from 'tsyringe';
import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import { IFetcher } from '@application/ports/fetcher.port';
import SteamInventoryService from '@application/services/steam-inventory.service';
import HttpConfigurationService from '@application/services/http-configuration.service';
import CookieParserService from '@domain/services/cookie-parser.service';
import FindCardBorderTypeUseCase from '@application/use-cases/find-card-border-type.use-case';
import FindTagUseCase from '@application/use-cases/find-tag.use-case';
import GetImageUrlUseCase from '@application/use-cases/get-image-url.use-case';
import LoadInventoryUseCase from '@application/use-cases/load-inventory.use-case';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { CardType } from '@domain/types/card-type.type';
import { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { rawTag } from '@domain/types/raw-tag.type';
import { HttpClient } from './http-client';
import { ResilientHttpFetcher } from './ResilientHttpFetcher';

// Register all dependencies
container.registerSingleton(CookieParserService);
container.registerSingleton(HttpConfigurationService);
container.registerSingleton(SteamInventoryService);
container.registerSingleton(FindTagUseCase);
container.registerSingleton(GetImageUrlUseCase);
container.registerSingleton(FindCardBorderTypeUseCase);

/**
 * Main Steam Inventory Loader - Pure Composition Root
 * Delegates all business operations to the service layer
 */
export default class AzulSteamInventoryLoader implements IAzulSteamInventoryLoader {
  private readonly container = container.createChildContainer();
  private readonly steamInventoryService: SteamInventoryService;
  private readonly httpConfigurationService: HttpConfigurationService;

  constructor(private readonly config: LoaderConfig) {
    // Register fetcher factory
    this.container.register<IFetcher>('IFetcher', {
      useFactory: () => {
        const httpClient = new HttpClient(this.config.proxyAddress);
        return new ResilientHttpFetcher(httpClient, {
          maxRetries: this.config.maxRetries,
        });
      },
    });

    // Resolve services
    this.steamInventoryService = this.container.resolve(SteamInventoryService);
    this.httpConfigurationService = this.container.resolve(HttpConfigurationService);
  }

  /**
   * Loads a Steam inventory for the specified user and application
   */
  public async load(
    steamID64: string,
    appID: string,
    contextID: string,
  ): Promise<SteamItemEntity[]> {
    // Configure HTTP client for this request
    const fetcher = this.container.resolve<IFetcher>('IFetcher') as ResilientHttpFetcher;
    const httpClient = fetcher.getFetcher() as HttpClient;
    
    this.httpConfigurationService.configureHttpClient(httpClient, {
      steamID64,
      appID,
      contextID,
      config: this.config,
    });

    // Delegate to service layer
    return this.steamInventoryService.loadInventory({
      steamID64,
      appID,
      contextID,
      config: this.config,
    });
  }

  /**
   * Finds a specific tag within a collection of tags
   */
  public getTag(
    tags: Array<rawTag | SteamItemTag>,
    categoryToFind: string,
  ): rawTag | SteamItemTag | null {
    return this.steamInventoryService.findTag({ tags, categoryToFind });
  }

  /**
   * Generates the appropriate image URL for a Steam item
   */
  public getImageUrl(
    input: InputWithIconURL,
    size?: 'normal' | 'large',
  ): string {
    return this.steamInventoryService.getImageUrl({ input, size });
  }

  /**
   * Determines if a trading card is foil based on its tags
   */
  public isCardFoil(
    tags: Array<rawTag | SteamItemTag>,
  ): CardType | null {
    return this.steamInventoryService.findCardBorderType({ tags });
  }
}
