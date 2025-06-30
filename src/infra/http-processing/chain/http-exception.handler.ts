import { StatusCode } from 'status-code-enum';
import { injectable } from 'tsyringe';

import { HttpClientResponse } from '@domain/types/http-response.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import {
  HttpException,
  PrivateProfileException,
  RateLimitedException,
} from '@infra/exceptions';

import { AbstractHandler, HttpProcessingContext } from './handler';

@injectable()
export class HttpExceptionHandler extends AbstractHandler<unknown> {
  public handle(context: HttpProcessingContext<unknown>): InventoryPageResult {
    const { error, request } = context;

    if (!error) {
      return super.handle(context);
    }

    const exception = this.createHttpException(error, request);
    // eslint-disable-next-line no-console
    console.error(exception.message, exception);

    this.checkForSpecificExceptions(exception, context);

    // If no specific exception was thrown, we continue the chain.
    return super.handle(context);
  }

  private checkForSpecificExceptions(
    exception: HttpException,
    context: HttpProcessingContext<unknown>,
  ): void {
    const { request } = context;
    const { statusCode } = exception.props.response ?? {};

    switch (statusCode) {
      case StatusCode.ClientErrorForbidden:
        throw new PrivateProfileException({
          request,
          response: exception.props.response ?? {},
        });
      case StatusCode.ClientErrorTooManyRequests:
        throw new RateLimitedException({
          request,
          response: exception.props.response ?? {},
        });
      default:
      // Not a specific error we handle, so we do nothing.
    }
  }

  private createHttpException(
    error: unknown,
    request: HttpProcessingContext<unknown>['request'],
  ): HttpException {
    if (error instanceof HttpException) {
      return error;
    }
    if (error instanceof Error && 'response' in error) {
      const response = error.response as Partial<HttpClientResponse<unknown>>;
      return new HttpException({
        message: 'Internal Server Error',
        request,
        response,
      });
    }

    return new HttpException({
      message: 'An unknown error occurred',
      request,
      response: { statusCode: 500 },
    });
  }
}
