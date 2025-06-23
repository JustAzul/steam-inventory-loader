import 'reflect-metadata';
import InventoryPageService from '@application/services/inventory-page.service';
import { jest } from '@jest/globals';

import GetInventoryPageResultUseCase from '../get-inventory-page-result.use-case';
import GetPageUrlUseCase from '../get-page-url.use-case';

export const createGetInventoryPageMock =
  (): jest.Mocked<GetInventoryPageResultUseCase> => {
    return {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetInventoryPageResultUseCase>;
  };

export const createGetPageUrlMock = (): jest.Mocked<GetPageUrlUseCase> => {
  return {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GetPageUrlUseCase>;
};

export const createInventoryPageServiceMock =
  (): jest.Mocked<InventoryPageService> => {
    return {
      getInventoryPage: jest.fn(),
    } as unknown as jest.Mocked<InventoryPageService>;
  };
