import { injectable } from 'tsyringe';

import { InventoryPageResult } from '@application/types/inventory-page-result.type';
import { AbstractHandler, HttpProcessingContext } from './handler';
import SteamBodyErrorException from '@application/exceptions/steam-body-error.exception';

@injectable()
export class SteamBodyValidationHandler extends AbstractHandler<InventoryPageResult> {
  public handle(
    context: HttpProcessingContext<InventoryPageResult>,
  ): any {
    const { request, response } = context;

    if (!response) {
      throw new Error('SteamBodyValidationHandler received an empty response.');
    }

    if (response.data?.error) {
      throw new SteamBodyErrorException({ request, response });
    }
    if (response.data?.success === 0) {
      throw new SteamBodyErrorException({ request, response });
    }
    return super.handle(context);
  }
} 