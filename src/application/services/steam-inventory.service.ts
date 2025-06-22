import { injectable, inject } from 'tsyringe';
import SteamItemEntity from '@domain/entities/steam-item.entity';
import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { CardType } from '@domain/types/card-type.type';
import { InputWithIconURL } from '@domain/types/input-with-icon-url.type';
import { LoaderConfig } from '@domain/types/loader-config.type';
import { rawTag } from '@domain/types/raw-tag.type';
import FindCardBorderTypeUseCase from '../use-cases/find-card-border-type.use-case';
import FindTagUseCase from '../use-cases/find-tag.use-case';
import GetImageUrlUseCase from '../use-cases/get-image-url.use-case';
import LoadInventoryUseCase from '../use-cases/load-inventory.use-case';

export interface LoadInventoryParams {
  steamID64: string;
  appID: string;
  contextID: string;
  config: LoaderConfig;
}

export interface FindTagParams {
  tags: Array<rawTag | SteamItemTag>;
  categoryToFind: string;
}

export interface GetImageUrlParams {
  input: InputWithIconURL;
  size?: 'normal' | 'large';
}

export interface FindCardBorderTypeParams {
  tags: Array<rawTag | SteamItemTag>;
}

/**
 * Service layer for Steam inventory operations
 * Provides cohesive business operations instead of exposing individual use cases
 */
@injectable()
export default class SteamInventoryService {
  public constructor(
    @inject(LoadInventoryUseCase)
    private readonly loadInventoryUseCase: LoadInventoryUseCase,
    @inject(FindTagUseCase)
    private readonly findTagUseCase: FindTagUseCase,
    @inject(GetImageUrlUseCase)
    private readonly getImageUrlUseCase: GetImageUrlUseCase,
    @inject(FindCardBorderTypeUseCase)
    private readonly findCardBorderTypeUseCase: FindCardBorderTypeUseCase,
  ) {}

  /**
   * Loads a complete Steam inventory for the specified user and application
   * @param params - Parameters for loading inventory
   * @returns Promise resolving to array of Steam items
   */
  public async loadInventory(params: LoadInventoryParams): Promise<SteamItemEntity[]> {
    return this.loadInventoryUseCase.execute(params);
  }

  /**
   * Finds a specific tag within a collection of tags
   * @param params - Parameters for finding tag
   * @returns The matching tag or null if not found
   */
  public findTag(params: FindTagParams): rawTag | SteamItemTag | null {
    return this.findTagUseCase.execute(params);
  }

  /**
   * Generates the appropriate image URL for a Steam item
   * @param params - Parameters for generating image URL
   * @returns Complete image URL
   */
  public getImageUrl(params: GetImageUrlParams): string {
    return this.getImageUrlUseCase.execute(params);
  }

  /**
   * Determines the card border type (Normal/Foil) for trading cards
   * @param params - Parameters for determining card border type
   * @returns Card border type or null if not a card
   */
  public findCardBorderType(params: FindCardBorderTypeParams): CardType | null {
    return this.findCardBorderTypeUseCase.execute(params);
  }
} 