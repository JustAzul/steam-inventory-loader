import { injectable } from 'tsyringe';

import SteamBodyErrorException from '@application/exceptions/steam-body-error.exception';
import { HttpResponse } from '@application/types/http-response.type';
import { InventoryPageResult } from '@application/types/inventory-page-result.type';

import { AbstractHandler, HttpProcessingContext } from './handler';


@injectable()
export class SteamBodyValidationHandler extends AbstractHandler<InventoryPageResult> {
  public handle(
    context: HttpProcessingContext<InventoryPageResult>,
  ): HttpResponse<InventoryPageResult> {
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