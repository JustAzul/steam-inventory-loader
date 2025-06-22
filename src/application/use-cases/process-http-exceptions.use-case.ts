import { StatusCode } from 'status-code-enum';
import { ErrorPayload } from '@shared/errors';
import { HttpClientErrorCodes } from '@application/types/http-response.type';

import HttpException from '../exceptions/http.exception';
import PrivateProfileException from '../exceptions/private-profile.exception';
import RateLimitedException from '../exceptions/rate-limited.exception';
import { HttpExceptionProps } from '../exceptions/http.exception';

export default class ProcessHttpExceptionsUseCase {
  public execute(error: ErrorPayload<HttpClientErrorCodes>): void {
    const httpException = new HttpException(
      error.payload as HttpExceptionProps,
    );
    const { response } = httpException.props;
    const hasStatusCode = Boolean(response?.statusCode);

    if (hasStatusCode) {
      const { statusCode } = response;

      if (
        statusCode === StatusCode.ClientErrorForbidden ||
        statusCode === StatusCode.ClientErrorBadRequest
      ) {
        throw new PrivateProfileException(httpException.props);
      }

      if (statusCode === StatusCode.ClientErrorTooManyRequests) {
        throw new RateLimitedException(httpException.props);
      }
    }
  }
}
