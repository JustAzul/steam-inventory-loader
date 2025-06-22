import { ErrorPayload } from '@shared/errors';
import {
  HttpClientErrorCodes,
  HttpClientResponse,
} from '@application/types/http-response.type';
import ProcessHttpExceptionsUseCase from '../process-http-exceptions.use-case';
import ValidateHttpResponseUseCase from '../validate-http-response.use-case';
import ProcessSteamErrorResultUseCase from '../process-steam-error-result.use-case';
import GetHttpResponseWithExceptionUseCase from '../get-http-response-with-exception.use-case';
import PrivateProfileException from '@application/exceptions/private-profile.exception';
import { StatusCode } from 'status-code-enum';
import RateLimitedException from '@application/exceptions/rate-limited.exception';
import SteamErrorResultException from '@application/exceptions/steam-error-result.exception';
import BadStatusCodeException from '@application/exceptions/bad-status-code.exception';
import EmptyHttpResponseException from '@application/exceptions/empty-http-response.exception';
import { IFetcher } from '@application/ports/fetcher.port';
import { DataOrError } from '@shared/utils';

describe('Application :: UseCases :: HttpProcessingChain', () => {
  describe('ProcessSteamErrorResultUseCase', () => {
    it('should throw SteamErrorResultException when response data contains an error', () => {
      const useCase = new ProcessSteamErrorResultUseCase();
      const response: HttpClientResponse<any> = {
        data: { error: 'Something went wrong (16)' },
        headers: {},
        statusCode: 200,
      };
      expect(() => useCase.execute(response)).toThrow(
        new SteamErrorResultException('16', 'Something went wrong'),
      );
    });
  });

  describe('ValidateHttpResponseUseCase', () => {
    const processSteamErrorResultUseCase = new ProcessSteamErrorResultUseCase();
    const useCase = new ValidateHttpResponseUseCase(
      processSteamErrorResultUseCase,
    );
    it('should throw BadStatusCodeException for non-200 status', () => {
      const response: HttpClientResponse<any> = {
        data: {},
        headers: {},
        statusCode: 500,
      };
      expect(() => useCase.execute({ url: '' }, response)).toThrow(
        BadStatusCodeException,
      );
    });
    it('should throw EmptyHttpResponseException for null data', () => {
      const response: HttpClientResponse<any> = {
        data: null,
        headers: {},
        statusCode: 200,
      };
      expect(() => useCase.execute({ url: '' }, response)).toThrow(
        EmptyHttpResponseException,
      );
    });
  });

  describe('ProcessHttpExceptionsUseCase', () => {
    const useCase = new ProcessHttpExceptionsUseCase();
    it('should throw PrivateProfileException on 403 Forbidden', () => {
      const error: ErrorPayload<HttpClientErrorCodes> = {
        code: 'HTTP_CLIENT_ERROR',
        payload: {
          response: { statusCode: StatusCode.ClientErrorForbidden },
        },
      };
      expect(() => useCase.execute(error)).toThrow(PrivateProfileException);
    });

    it('should throw RateLimitedException on 429 Too Many Requests', () => {
      const error: ErrorPayload<HttpClientErrorCodes> = {
        code: 'HTTP_CLIENT_ERROR',
        payload: {
          response: { statusCode: StatusCode.ClientErrorTooManyRequests },
        },
      };
      expect(() => useCase.execute(error)).toThrow(RateLimitedException);
    });
  });

  describe('GetHttpResponseWithExceptionUseCase', () => {
    let mockFetcher: jest.Mocked<IFetcher>;
    let processHttpExceptionsUseCase: ProcessHttpExceptionsUseCase;
    let validateHttpResponseUseCase: ValidateHttpResponseUseCase;
    let useCase: GetHttpResponseWithExceptionUseCase;

    beforeEach(() => {
      mockFetcher = { execute: jest.fn() };
      processHttpExceptionsUseCase = { execute: jest.fn() };
      validateHttpResponseUseCase = { execute: jest.fn() } as any;
      useCase = new GetHttpResponseWithExceptionUseCase({
        fetcher: mockFetcher,
        processHttpExceptionsUseCase,
        validateHttpResponseUseCase,
      });
    });

    it('should call validation use case on success', async () => {
      const successResponse: HttpClientResponse<any> = {
        data: { message: 'success' },
        headers: {},
        statusCode: 200,
      };
      const successResult: DataOrError<any, any> = [undefined, successResponse];
      mockFetcher.execute.mockResolvedValue(successResult);

      await useCase.execute({ url: '' });
      expect(validateHttpResponseUseCase.execute).toHaveBeenCalledWith(
        { url: '' },
        successResponse,
      );
    });

    it('should call exception processing use case on error', async () => {
      const errorPayload: ErrorPayload<HttpClientErrorCodes> = {
        code: 'HTTP_CLIENT_ERROR',
        payload: {},
      };
      const errorResult: DataOrError<any, any> = [errorPayload];
      mockFetcher.execute.mockResolvedValue(errorResult);

      // We expect this to throw since the mock process use case doesn't
      await expect(useCase.execute({ url: '' })).rejects.toThrow();
      expect(processHttpExceptionsUseCase.execute).toHaveBeenCalledWith(
        errorPayload,
      );
    });
  });
}); 