import 'reflect-metadata';
import { injectable } from 'tsyringe';

import { GetInventoryPageResultUseCaseProps } from '../types/get-inventory-page-result-use-case-props.type';
import { InventoryPageResult } from '../types/inventory-page-result.type';
import GetInventoryPageResultUseCase from '../use-cases/get-inventory-page-result.use-case';
import GetPageUrlUseCase from '../use-cases/get-page-url.use-case';
import { HttpProcessingChainUseCase } from '../use-cases/http-processing-chain.use-case';

@injectable()
export default class InventoryPageService {
  public constructor(
    private readonly getInventoryPageResultUseCase: GetInventoryPageResultUseCase,
    private readonly getPageUrlUseCase: GetPageUrlUseCase,
    private readonly httpProcessingChain: HttpProcessingChainUseCase,
  ) {}

  public async getInventoryPage(
    props: GetInventoryPageResultUseCaseProps,
  ): Promise<InventoryPageResult> {
    const { url } = this.getPageUrlUseCase.execute(props);
    const [error, response] =
      await this.getInventoryPageResultUseCase.execute(url);

    const processedResponse = this.httpProcessingChain.execute({
      error,
      request: { url },
      response: response || { data: null, headers: {}, statusCode: 0 },
    });

    return processedResponse.data!;
  }
}
