import { injectable } from 'tsyringe';

import { HttpRequest } from '@domain/types/http-request.type';
import { HttpClientResponse } from '@domain/types/http-response.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import { SteamBodyErrorException } from '@infra/exceptions';

import { AbstractHandler, HttpProcessingContext } from './handler';

@injectable()
export class SteamBodyValidationHandler extends AbstractHandler<InventoryPageResult> {
  private validateBody(
    body: InventoryPageResult | null,
    request: HttpRequest,
    response: HttpClientResponse<InventoryPageResult>,
  ): void {
    if (
      typeof body === 'object' &&
      body !== null &&
      'success' in body &&
      (body as Record<string, unknown>).success === false
    ) {
      throw new SteamBodyErrorException({ request, response });
    }

    if (
      typeof body !== 'object' ||
      body === null ||
      !('assets' in body) ||
      !('descriptions' in body)
    ) {
      throw new SteamBodyErrorException({ request, response });
    }
  }

  public handle(
    context: HttpProcessingContext<InventoryPageResult>,
  ): InventoryPageResult {
    const { request, response } = context;

    if (!response) {
      throw new SteamBodyErrorException({ request, response: {} });
    }

    this.validateBody(response.data, request, response);

    return super.handle(context);
  }
}
