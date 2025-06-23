import { injectable } from 'tsyringe';

import { SteamBodyErrorException } from '@domain/exceptions/steam-body-error.exception';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';

import { AbstractHandler, HttpProcessingContext } from './handler';

@injectable()
export class SteamBodyValidationHandler extends AbstractHandler<InventoryPageResult> {
  public handle(
    context: HttpProcessingContext<InventoryPageResult>,
  ): InventoryPageResult {
    const { request, response } = context;

    if (!response || !response.data) {
      throw new Error('SteamBodyValidationHandler received an empty response or response data.');
    }

    if (response.data.error) {
      throw new SteamBodyErrorException({ request, response });
    }
    if (response.data.success === 0) {
      throw new SteamBodyErrorException({ request, response });
    }
    return response.data;
  }
} 