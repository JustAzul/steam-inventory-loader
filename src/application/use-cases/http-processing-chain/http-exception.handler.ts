import { StatusCode } from 'status-code-enum';
import { injectable } from 'tsyringe';

import PrivateProfileException from '@application/exceptions/private-profile.exception';
import RateLimitedException from '@application/exceptions/rate-limited.exception';
import UseCaseException from '@application/exceptions/use-case.exception';
import {
  HttpClientErrorCodes,
  HttpClientResponse,
  HttpErrorPayload,
} from '@application/types/http-response.type';
import { ErrorPayload } from '@shared/errors';

import { AbstractHandler, HttpProcessingContext } from './handler';

@injectable()
export class HttpExceptionHandler extends AbstractHandler<any> {
  public handle(context: HttpProcessingContext<any>): HttpClientResponse<any> {
    const { error } = context;
    if (error) {
      this.processError(context);
    }
    return super.handle(context);
  }

  private processError(context: HttpProcessingContext<any>): void {
    const { request, response, error } = context;
    const payloadError = error as ErrorPayload<
      HttpClientErrorCodes,
      HttpErrorPayload
    >;

    if (payloadError.payload?.response?.statusCode) {
      const { statusCode } = payloadError.payload.response;
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