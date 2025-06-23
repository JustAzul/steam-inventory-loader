import { StatusCode } from 'status-code-enum';
import { injectable } from 'tsyringe';

import {
  HttpException,
  PrivateProfileException,
  RateLimitedException,
  UseCaseException,
} from '@domain/exceptions';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';

import { AbstractHandler, HttpProcessingContext } from './handler';

@injectable()
export class HttpExceptionHandler extends AbstractHandler<unknown> {
  public handle(
    context: HttpProcessingContext<unknown>,
  ): InventoryPageResult {
    const { error } = context;
    if (error) {
      this.processError(context);
    }
    return super.handle(context);
  }

  private processError(context: HttpProcessingContext<unknown>): void {
    const { request, response, error } = context;

    if (error instanceof HttpException) {
      const statusCode = error.props.response?.statusCode;

      if (statusCode === StatusCode.ClientErrorForbidden) {
        throw new PrivateProfileException({ request, response: response || {} });
      }
      if (statusCode === StatusCode.ClientErrorTooManyRequests) {
        throw new RateLimitedException({ request, response: response || {} });
      }
    }

    throw new UseCaseException(
      HttpExceptionHandler.name,
      `Handler failed to process a known error: ${JSON.stringify(error)}`,
    );
  }
} 