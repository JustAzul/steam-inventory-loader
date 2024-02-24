import HttpException from '../../exceptions/http.exception';
import PrivateProfileException from '../../exceptions/private-profile.exception';
import RateLimitedException from '../../exceptions/rate-limited.exception';
import ProcessHttpExceptionsUseCase from '../process-http-exceptions.use-case';

function generateHttpException(statusCode: number) {
  return new HttpException({
    message: 'Mocked HTTP Exception',
    request: {
      url: 'https://justazul.com',
    },
    response: {
      statusCode,
    },
  });
}

describe(ProcessHttpExceptionsUseCase.name, () => {
  it('should throw PrivateProfileException when the status code is 403', () => {
    const httpException = generateHttpException(403);
    const processHttpExceptionsUseCase = new ProcessHttpExceptionsUseCase(
      httpException,
    );

    expect(() => {
      processHttpExceptionsUseCase.execute();
    }).toThrow(PrivateProfileException);
  });

  it('should throw RateLimitedException when the status code is 429', () => {
    const httpException = generateHttpException(429);
    const processHttpExceptionsUseCase = new ProcessHttpExceptionsUseCase(
      httpException,
    );

    expect(() => {
      processHttpExceptionsUseCase.execute();
    }).toThrow(RateLimitedException);
  });
});
