import 'reflect-metadata';
import { container, Lifecycle } from 'tsyringe';
import IAzulSteamInventoryLoader from '@application/ports/azul-steam-inventory-loader.interface';
import { IFetcher } from '@application/ports/fetcher.port';
import FindCardBorderTypeUseCase from '@application/use-cases/find-card-border-type.use-case';
import FindTagUseCase from '@application/use-cases/find-tag.use-case';
import GetImageUrlUseCase from '@application/use-cases/get-image-url.use-case';
import LoadInventoryUseCase from '@application/use-cases/load-inventory.use-case';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { CardType } from '@domain/types/card-type.type';
import { Cookie } from '@domain/types/cookie.type';
import { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { rawTag } from '@domain/types/raw-tag.type';
import { CookieJar } from 'tough-cookie';
import { HttpClient } from './http-client';
import { ResilientHttpFetcher } from './ResilientHttpFetcher';

container.registerSingleton(FindTagUseCase);
container.registerSingleton(GetImageUrlUseCase);
container.registerSingleton(FindCardBorderTypeUseCase);

export default class AzulSteamInventoryLoader
  implements IAzulSteamInventoryLoader
{
  private readonly container = container.createChildContainer();

  constructor(private readonly config: LoaderConfig) {
    this.container.register<IFetcher>('IFetcher', {
      useFactory: () => {
        const httpClient = new HttpClient(this.config.proxyAddress);
        return new ResilientHttpFetcher(httpClient, {
          maxRetries: this.config.maxRetries,
        });
      },
    });
  }

  public load(
    steamID64: string,
    appID: string,
    contextID: string,
  ): Promise<SteamItemEntity[]> {
    const useCase = this.container.resolve(LoadInventoryUseCase);
    const fetcher = this.container.resolve<IFetcher>(
      'IFetcher',
    ) as ResilientHttpFetcher;
    const httpClient = fetcher.getFetcher() as HttpClient;

    const cookies: string[] = [`strInventoryLastContext=${appID}_${contextID}`];
    if (this.config.SteamCommunity_Jar) {
      function parseCookies(jar?: CookieJar): string[] {
        if (!jar) return [];
        if ('_jar' in jar) return parseCookies((jar as any)._jar);
        const result = (jar.serializeSync().cookies as Cookie[])
          .filter(({ domain }) => domain === 'steamcommunity.com')
          .map(({ key, value }) => `${key}=${value};`);
        return result;
      }
      cookies.push(...parseCookies(this.config.SteamCommunity_Jar));
    }
    httpClient.setDefaultCookies(cookies.join('; '));
    httpClient.setDefaultHeaders({
      host: 'steamcommunity.com',
      referer: `https://steamcommunity.com/profiles/${steamID64}/inventory`,
    });

    return useCase.execute({
      steamID64,
      appID,
      contextID,
      config: this.config,
    });
  }

  public getTag(
    tags: Array<rawTag | SteamItemTag>,
    categoryToFind: string,
  ): rawTag | SteamItemTag | null {
    const useCase = this.container.resolve(FindTagUseCase);
    return useCase.execute({ tags, categoryToFind });
  }

  public getImageUrl(
    input: InputWithIconURL,
    size?: 'normal' | 'large',
  ): string {
    const useCase = this.container.resolve(GetImageUrlUseCase);
    return useCase.execute({ input, size });
  }

  public isCardFoil(
    tags: Array<rawTag | SteamItemTag>,
  ): CardType | null {
    const useCase = this.container.resolve(FindCardBorderTypeUseCase);
    return useCase.execute({ tags });
  }
}
