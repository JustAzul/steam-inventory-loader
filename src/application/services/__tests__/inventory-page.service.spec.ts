import 'reflect-metadata';
import { GetInventoryPageResultUseCaseProps } from '@application/types/get-inventory-page-result-use-case-props.type';
import { HttpResponse } from '@application/types/http-response.type';
import { InventoryPageResult } from '@application/types/inventory-page-result.type';
import { container } from 'tsyringe';
import { inventoryPageResultMock } from '../../use-cases/__tests__/mocks';

import InventoryPageService from '../inventory-page.service';
import GetInventoryPageResultUseCase from '../../use-cases/get-inventory-page-result.use-case';
import GetPageUrlUseCase from '../../use-cases/get-page-url.use-case';
import {
  createGetInventoryPageMock,
  createGetPageUrlMock,
} from '../../use-cases/__tests__/use-case.mocks';
import { HttpProcessingChainUseCase } from '../../use-cases/http-processing-chain.use-case';
import PrivateProfileException from '@application/exceptions/private-profile.exception';

describe('Application :: Services :: InventoryPageService', () => {
  let service: InventoryPageService;
  let getInventoryPageResultUseCase: jest.Mocked<GetInventoryPageResultUseCase>;
  let getPageUrlUseCase: jest.Mocked<GetPageUrlUseCase>;
  let httpProcessingChain: jest.Mocked<HttpProcessingChainUseCase>;

  beforeEach(() => {
    jest.clearAllMocks();

    getInventoryPageResultUseCase = createGetInventoryPageMock();
    getPageUrlUseCase = createGetPageUrlMock();
    httpProcessingChain = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<HttpProcessingChainUseCase>;

    container.registerInstance(
      GetInventoryPageResultUseCase,
      getInventoryPageResultUseCase,
    );
    container.registerInstance(GetPageUrlUseCase, getPageUrlUseCase);
    container.registerInstance(HttpProcessingChainUseCase, httpProcessingChain);

    service = container.resolve(InventoryPageService);
  });

  it('should orchestrate fetching and processing successfully', async () => {
    const props = {} as GetInventoryPageResultUseCaseProps;
    const url = 'http://test.com';
    const response: HttpResponse<InventoryPageResult> = {
      data: inventoryPageResultMock.page1,
      headers: {},
      statusCode: 200,
    };

    getPageUrlUseCase.execute.mockReturnValue({ url, params: {} });
    getInventoryPageResultUseCase.execute.mockResolvedValue([
      undefined,
      response,
    ]);
    httpProcessingChain.execute.mockReturnValue(response);

    const result = await service.getInventoryPage(props);

    expect(getPageUrlUseCase.execute).toHaveBeenCalledWith(props);
    expect(getInventoryPageResultUseCase.execute).toHaveBeenCalledWith(url);
    expect(httpProcessingChain.execute).toHaveBeenCalledWith({
      error: undefined,
      request: { url },
      response,
    });
    expect(result).toEqual(inventoryPageResultMock.page1);
  });

  it('should orchestrate http exception handling', async () => {
    const props = {} as GetInventoryPageResultUseCaseProps;
    const url = 'http://test.com';

    getPageUrlUseCase.execute.mockReturnValue({ url, params: {} });
    getInventoryPageResultUseCase.execute.mockResolvedValue([
      undefined,
      { data: null, headers: {}, statusCode: 403 },
    ]);
    httpProcessingChain.execute.mockImplementation(() => {
      throw new PrivateProfileException({ request: { url: '' }, response: {} });
    });

    await expect(service.getInventoryPage(props)).rejects.toThrow(
      PrivateProfileException,
    );
  });
});
