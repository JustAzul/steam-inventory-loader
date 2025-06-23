import 'reflect-metadata';
import { container } from 'tsyringe';

import { HttpProcessingContext } from '../chain/handler';
import { HttpExceptionHandler } from '../chain/http-exception.handler';
import { HttpResponseValidationHandler } from '../chain/http-response-validation.handler';
import { SteamBodyValidationHandler } from '../chain/steam-body-validation.handler';
import { HttpResponseProcessor } from '../http-response-processor';

describe('Infra :: HttpProcessing :: HttpResponseProcessor', () => {
  let processor: HttpResponseProcessor;
  let httpExceptionHandler: jest.Mocked<HttpExceptionHandler>;
  let httpResponseValidationHandler: jest.Mocked<HttpResponseValidationHandler>;
  let steamBodyValidationHandler: jest.Mocked<SteamBodyValidationHandler>;

  beforeEach(() => {
    httpExceptionHandler = {
      setNext: jest.fn().mockReturnThis(),
      handle: jest.fn(),
    } as unknown as jest.Mocked<HttpExceptionHandler>;

    httpResponseValidationHandler = {
      setNext: jest.fn().mockReturnThis(),
      handle: jest.fn(),
    } as unknown as jest.Mocked<HttpResponseValidationHandler>;

    steamBodyValidationHandler = {
      setNext: jest.fn().mockReturnThis(),
      handle: jest.fn(),
    } as unknown as jest.Mocked<SteamBodyValidationHandler>;

    httpExceptionHandler.setNext.mockReturnValue(httpResponseValidationHandler);
    httpResponseValidationHandler.setNext.mockReturnValue(
      steamBodyValidationHandler,
    );

    container.registerInstance(HttpExceptionHandler, httpExceptionHandler);
    container.registerInstance(
      HttpResponseValidationHandler,
      httpResponseValidationHandler,
    );
    container.registerInstance(
      SteamBodyValidationHandler,
      steamBodyValidationHandler,
    );

    processor = container.resolve(HttpResponseProcessor);
  });

  it('should construct the chain correctly', () => {
    expect(httpExceptionHandler.setNext).toHaveBeenCalledWith(
      httpResponseValidationHandler,
    );
    expect(httpResponseValidationHandler.setNext).toHaveBeenCalledWith(
      steamBodyValidationHandler,
    );
  });

  it('should execute the chain starting with the first handler', () => {
    const context: HttpProcessingContext = { request: { url: 'test' } };
    processor.execute(context);
    expect(httpExceptionHandler.handle).toHaveBeenCalledWith(context);
  });
}); 