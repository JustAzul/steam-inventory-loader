import { container } from 'tsyringe';

import IAzulSteamInventoryLoader from '../application/ports/azul-steam-inventory-loader.interface';
import { IFetcher } from '../application/ports/fetcher.port';
import FindCardBorderTypeUseCase from '../application/use-cases/find-card-border-type.use-case';
import FindTagUseCase from '../application/use-cases/find-tag.use-case';
import GetImageUrlUseCase from '../application/use-cases/get-image-url.use-case';
import LoadInventoryUseCase from '../application/use-cases/load-inventory.use-case';
import { registerAllDependencies } from '../dependency-container';
import SteamItemTag from '../domain/entities/steam-item-tag.entity';
import SteamItemEntity from '../domain/entities/steam-item.entity';
import { CardType } from '../domain/types/card-type.type';
import { InputWithIconURL } from '../domain/types/input-with-icon-url.type';
import { LoaderConfig } from '../domain/types/loader-config.type';
import { rawTag } from '../domain/types/raw-tag.type';
import { HttpClient } from '../infra/http-client';
import { ResilientHttpFetcher } from '../infra/ResilientHttpFetcher';
import {
  DEFAULT_REQUEST_MAX_RETRIES,
  PROXY_ADDRESS,
} from '../shared/constants';

export class AzulSteamInventoryLoader extends IAzulSteamInventoryLoader {
  private requestConfig: Partial<LoaderConfig> | null = null;

  constructor(private readonly globalConfig: LoaderConfig) {
    super();
  }

  public withConfig(config: Partial<LoaderConfig>): this {
    this.requestConfig = config;
    return this;
  }

  public async load(
    steamID64: string,
    appID: string,
    contextID: string,
  ): Promise<SteamItemEntity[]> {
    const requestContainer = container.createChildContainer();
    registerAllDependencies(requestContainer);

    const config = { ...this.globalConfig, ...this.requestConfig };
    this.requestConfig = null; // Reset after use

    requestContainer.register(PROXY_ADDRESS, {
      useValue: config.proxyAddress || '',
    });
    requestContainer.register('AxiosInstance', {
      useValue: undefined,
    });
    requestContainer.register<IFetcher>('IFetcher', {
      useFactory: (c) =>
        new ResilientHttpFetcher(c.resolve(HttpClient), {
          maxRetries: config.maxRetries || DEFAULT_REQUEST_MAX_RETRIES,
        }),
    });

    const useCase = requestContainer.resolve(LoadInventoryUseCase);
    return useCase.execute({ steamID64, appID, contextID, config });
  }

  public getTag(
    tags: Array<rawTag | SteamItemTag>,
    categoryToFind: string,
  ): rawTag | SteamItemTag | null {
    const useCase = container.resolve(FindTagUseCase);
    return useCase.execute({ tags, categoryToFind });
  }

  public getImageUrl(
    input: InputWithIconURL,
    size?: 'normal' | 'large',
  ): string {
    const useCase = container.resolve(GetImageUrlUseCase);
    return useCase.execute({ input, size });
  }

  public isCardFoil(tags: Array<rawTag | SteamItemTag>): CardType | null {
    const useCase = container.resolve(FindCardBorderTypeUseCase);
    return useCase.execute({ tags });
  }
} 