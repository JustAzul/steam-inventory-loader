import { HttpRequest } from '@domain/types/http-request.type';
import { InventoryPageAsset } from '@domain/types/inventory-page-asset.type';
import { InventoryPageResult } from '@domain/types/inventory-page-result.type';
import { HttpException } from '@infra/exceptions';

import { AbstractHandler, HttpProcessingContext } from '../handler';

// Concrete test implementation of AbstractHandler
class TestHandler extends AbstractHandler {
  constructor(
    private readonly shouldHandle: boolean = false,
    private readonly resultToReturn?: InventoryPageResult,
  ) {
    super();
  }

  public handle(context: HttpProcessingContext): InventoryPageResult {
    if (this.shouldHandle && this.resultToReturn) {
      return this.resultToReturn;
    }
    return super.handle(context);
  }
}

// Another test handler for chaining
class SecondTestHandler extends AbstractHandler {
  constructor(private readonly resultToReturn: InventoryPageResult) {
    super();
  }

  public handle(): InventoryPageResult {
    return this.resultToReturn;
  }
}

describe('AbstractHandler', () => {
  let handler: TestHandler;
  let context: HttpProcessingContext;
  const mockRequest: HttpRequest = {
    headers: {},
    params: {},
    url: 'https://test.com',
  };

  beforeEach(() => {
    handler = new TestHandler();
    context = {
      request: mockRequest,
    };
  });

  describe('Constructor', () => {
    it('should create handler with no next handler initially', () => {
      expect(handler).toBeInstanceOf(AbstractHandler);
      expect(handler).toBeDefined();
    });
  });

  describe('setNext', () => {
    it('should set next handler and return it', () => {
      const mockResult: InventoryPageResult = {
        assets: [],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 1,
        total_inventory_count: 0,
      };
      const nextHandler = new SecondTestHandler(mockResult);

      const returnedHandler = handler.setNext(nextHandler);

      expect(returnedHandler).toBe(nextHandler);
    });

    it('should chain multiple handlers correctly', () => {
      const mockResult: InventoryPageResult = {
        assets: [],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 1,
        total_inventory_count: 0,
      };

      const secondHandler = new SecondTestHandler(mockResult);
      const thirdHandler = new SecondTestHandler(mockResult);

      handler.setNext(secondHandler).setNext(thirdHandler);

      // Verify that the chain works by calling handle
      const result = handler.handle(context);
      expect(result).toBe(mockResult);
    });
  });

  describe('handle', () => {
    it('should call next handler when one is set', () => {
      const mockResult: InventoryPageResult = {
        assets: [],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 1,
        total_inventory_count: 0,
      };

      const nextHandler = new SecondTestHandler(mockResult);
      handler.setNext(nextHandler);

      const result = handler.handle(context);

      expect(result).toBe(mockResult);
    });

    it('should throw error when no next handler is set', () => {
      const throwingFunction = (): InventoryPageResult =>
        handler.handle(context);
      expect(throwingFunction).toThrow(
        'HttpProcessingChain ended without a valid response.',
      );
    });

    it('should handle when current handler processes the request', () => {
      const mockResult: InventoryPageResult = {
        assets: [],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 1,
        total_inventory_count: 0,
      };

      const handlerThatProcesses = new TestHandler(true, mockResult);

      const result = handlerThatProcesses.handle(context);
      expect(result).toBe(mockResult);
    });

    it('should pass context through the chain', () => {
      const contextWithResponse: HttpProcessingContext = {
        request: mockRequest,
        response: {
          data: { test: 'data' },
          headers: {},
          statusCode: 200,
        },
      };

      const mockResult: InventoryPageResult = {
        assets: [],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 1,
        total_inventory_count: 0,
      };

      const nextHandler = new SecondTestHandler(mockResult);
      handler.setNext(nextHandler);

      const result = handler.handle(contextWithResponse);
      expect(result).toBe(mockResult);
    });

    it('should handle context with error', () => {
      const contextWithError: HttpProcessingContext = {
        error: new HttpException({
          message: 'Test error',
          request: mockRequest,
          response: {},
        }),
        request: mockRequest,
      };

      const mockResult: InventoryPageResult = {
        assets: [],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 0,
        total_inventory_count: 0,
      };

      const nextHandler = new SecondTestHandler(mockResult);
      handler.setNext(nextHandler);

      const result = handler.handle(contextWithError);
      expect(result).toBe(mockResult);
    });
  });

  describe('Chain behavior', () => {
    it('should process through multiple handlers in order', () => {
      const mockResult: InventoryPageResult = {
        assets: [],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 1,
        total_inventory_count: 0,
      };

      // Create a chain: handler1 -> handler2 -> handler3
      const handler1 = new TestHandler(false); // Doesn't handle, passes to next
      const handler2 = new TestHandler(false); // Doesn't handle, passes to next
      const handler3 = new SecondTestHandler(mockResult); // Handles and returns result

      handler1.setNext(handler2).setNext(handler3);

      const result = handler1.handle(context);
      expect(result).toBe(mockResult);
    });

    it('should stop at first handler that processes the request', () => {
      const firstResult: InventoryPageResult = {
        assets: [
          {
            amount: '1',
            appid: 1,
            assetid: 'first',
            classid: '1',
            contextid: '2',
            instanceid: '0',
          },
        ] as InventoryPageAsset[],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 1,
        total_inventory_count: 0,
      };

      const secondResult: InventoryPageResult = {
        assets: [
          {
            amount: '1',
            appid: 1,
            assetid: 'second',
            classid: '2',
            contextid: '2',
            instanceid: '0',
          },
        ] as InventoryPageAsset[],
        descriptions: [],
        last_assetid: '',
        more_items: 0,
        rwgrsn: 1,
        success: 1,
        total_inventory_count: 0,
      };

      // Create a chain where first handler processes the request
      const handler1 = new TestHandler(true, firstResult); // Handles and returns
      const handler2 = new SecondTestHandler(secondResult); // Should not be reached

      handler1.setNext(handler2);

      const result = handler1.handle(context);
      expect(result).toBe(firstResult);
      expect(result.assets[0].assetid).toBe('first');
    });
  });
});
