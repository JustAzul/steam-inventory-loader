import { StatusCode } from 'status-code-enum';

import BadStatusCodeException from '../../exceptions/bad-status-code.exception';
import EmptyHttpResponseException from '../../exceptions/empty-http-response.exception';
import { HttpRequest } from '../../types/http-request.type';
import { HttpResponse } from '../../types/http-response.type';
import ValidateHttpResponseUseCase from '../validate-http-response.use-case';

describe(ValidateHttpResponseUseCase.name, () => {
  const httpRequest: HttpRequest = {
    url: 'https://example.com',
  };

  it('should return a valid HttpResponse when statusCode is 200 and data is present', () => {
    const httpResponse: HttpResponse = {
      data: {
        someField: 'Some value',
      } as never,
      headers: {},
      statusCode: StatusCode.SuccessOK,
    };

    const validateHttpResponseUseCase = new ValidateHttpResponseUseCase({
      request: httpRequest,
      response: httpResponse,
    });

    const result = validateHttpResponseUseCase.execute();
    expect(result).toEqual(httpResponse);
  });

  it('should throw BadStatusCodeException when statusCode is not 200', () => {
    const httpResponse: HttpResponse = {
      data: {
        someField: 'Some value',
      } as never,
      headers: {},
      statusCode: StatusCode.ClientErrorBadRequest,
    };

    const validateHttpResponseUseCase = new ValidateHttpResponseUseCase({
      request: httpRequest,
      response: httpResponse,
    });

    expect(() => {
      validateHttpResponseUseCase.execute();
    }).toThrow(BadStatusCodeException);
  });

  it('should throw EmptyHttpResponseException when data is missing', () => {
    const httpResponse: HttpResponse = {
      data: null,
      headers: {},
      statusCode: StatusCode.SuccessOK,
    };

    const validateHttpResponseUseCase = new ValidateHttpResponseUseCase({
      request: httpRequest,
      response: httpResponse,
    });

    expect(() => {
      validateHttpResponseUseCase.execute();
    }).toThrow(EmptyHttpResponseException);
  });

  it('should throw any exception when data has an error but statusCode is SuccessOK', () => {
    const httpResponse: HttpResponse = {
      data: {
        error: 'Some error (42)',
      } as never,
      headers: {},
      statusCode: StatusCode.SuccessOK,
    };

    const validateHttpResponseUseCase = new ValidateHttpResponseUseCase({
      request: httpRequest,
      response: httpResponse,
    });

    expect(() => {
      validateHttpResponseUseCase.execute();
    }).toThrow();
  });
});
