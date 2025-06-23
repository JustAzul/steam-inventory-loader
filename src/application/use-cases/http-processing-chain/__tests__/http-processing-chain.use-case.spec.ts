import 'reflect-metadata';
import { container } from 'tsyringe';
import { HttpProcessingChainUseCase } from '../../http-processing-chain.use-case';
import { HttpExceptionHandler } from '../http-exception.handler';
import { HttpResponseValidationHandler } from '../http-response-validation.handler';
import { SteamBodyValidationHandler } from '../steam-body-validation.handler';

describe('Application :: UseCases :: HttpProcessingChainUseCase', () => {
  let useCase: HttpProcessingChainUseCase;
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

    useCase = container.resolve(HttpProcessingChainUseCase);
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
    const context = {} as any;
    useCase.execute(context);
    expect(httpExceptionHandler.handle).toHaveBeenCalledWith(context);
  });
}); 