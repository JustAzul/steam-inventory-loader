import { IFetcher } from '../ports/fetcher.port';
import {
  HttpClientGetProps,
  HttpClientResponse,
} from '../ports/http-client.interface';
import { InventoryPageResult } from '../types/inventory-page-result.type';

import ProcessHttpExceptionsUseCase from './process-http-exceptions.use-case';
import ValidateHttpResponseUseCase from './validate-http-response.use-case';
import UseCaseException from '@application/exceptions/use-case.exception';
import { ErrorPayload } from '@shared/errors';
import { HttpClientErrorCodes } from '@application/ports/http-client.interface';

export type GetHttpResponseWithExceptionConstructor = {
  fetcher: IFetcher;
  processHttpExceptionsUseCase: ProcessHttpExceptionsUseCase;
  validateHttpResponseUseCase: ValidateHttpResponseUseCase;
};

export default class GetHttpResponseWithExceptionUseCase {
  private readonly fetcher: IFetcher;
  private readonly processHttpExceptionsUseCase: ProcessHttpExceptionsUseCase;
  private readonly validateHttpResponseUseCase: ValidateHttpResponseUseCase;

  public constructor({
    fetcher,
    processHttpExceptionsUseCase,
    validateHttpResponseUseCase,
  }: Readonly<GetHttpResponseWithExceptionConstructor>) {
    this.fetcher = fetcher;
    this.processHttpExceptionsUseCase = processHttpExceptionsUseCase;
    this.validateHttpResponseUseCase = validateHttpResponseUseCase;
  }

  public async execute(
    httpClientProps: Readonly<HttpClientGetProps>,
  ): Promise<HttpClientResponse<InventoryPageResult>> {
    const [error, response] = await this.fetcher.execute<InventoryPageResult>(
      httpClientProps,
    );

    if (error) {
      this.processHttpExceptionsUseCase.execute(
        error as ErrorPayload<HttpClientErrorCodes>,
      );
      // The above line is expected to throw. If it doesn't, we have an issue.
      throw new UseCaseException(
        GetHttpResponseWithExceptionUseCase.name,
        'ProcessHttpExceptionsUseCase failed to throw an exception for a known error.',
      );
    }

    const validatedResponse = this.validateHttpResponseUseCase.execute(
      httpClientProps,
      response,
    );
    return validatedResponse;
  }
}
