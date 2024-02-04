import { StatusCode } from 'status-code-enum';

import HttpException from '../exceptions/http.exception';
import PrivateProfileException from '../exceptions/private-profile.exception';
import RateLimitedException from '../exceptions/rate-limited.exception';

export default class ProcessHttpExceptionsUseCase {
  private httpException: HttpException;

  public constructor(httpException: HttpException) {
    this.httpException = httpException;
  }

  public execute(): void {
    const { response } = this.httpException.props;
    const hasStatusCode = Boolean(response?.statusCode);

    if (hasStatusCode) {
      const { statusCode } = response;

      if (statusCode === StatusCode.ClientErrorForbidden) {
        throw new PrivateProfileException(this.httpException.props);
      }

      if (statusCode === StatusCode.ClientErrorTooManyRequests) {
        throw new RateLimitedException(this.httpException.props);
      }
    }
  }
}
