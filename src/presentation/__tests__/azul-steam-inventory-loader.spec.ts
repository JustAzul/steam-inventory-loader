import 'reflect-metadata';
import { CookieJar } from 'tough-cookie';
import { container } from 'tsyringe';

import LoadInventoryUseCase, {
  LoadInventoryPageUseCaseProps,
} from '@application/use-cases/load-inventory.use-case';
import SteamItemEntity from '@domain/entities/steam-item.entity';

import { AzulSteamInventoryLoader } from '../azul-steam-inventory-loader';

describe('AzulSteamInventoryLoader', () => {
  let loader: AzulSteamInventoryLoader;
  let mockLoadInventoryUseCase: jest.Mocked<LoadInventoryUseCase>;
  let mockCookieJar: CookieJar;

  beforeEach(() => {
    mockCookieJar = new CookieJar();
    
    mockLoadInventoryUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<LoadInventoryUseCase>;

    container.clearInstances();
    container.registerInstance(LoadInventoryUseCase, mockLoadInventoryUseCase);

    loader = new AzulSteamInventoryLoader(mockLoadInventoryUseCase);
  });

  describe('load', () => {
    it('should delegate to LoadInventoryUseCase.execute and return the result', async () => {
      // Arrange
      const props: LoadInventoryPageUseCaseProps = {
        steamID64: '76561198000000000',
        appID: 730,
        contextID: '2',
        config: {
          Language: 'en',
          itemsPerPage: 50,
          tradableOnly: false,
          SteamCommunity_Jar: mockCookieJar,
        },
      };

      const mockItems: SteamItemEntity[] = [];
      mockLoadInventoryUseCase.execute.mockResolvedValue(mockItems);

      // Act
      const result = await loader.load(props);

      // Assert
      expect(mockLoadInventoryUseCase.execute).toHaveBeenCalledWith(props);
      expect(mockLoadInventoryUseCase.execute).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockItems);
    });

    it('should propagate errors from LoadInventoryUseCase', async () => {
      // Arrange
      const props: LoadInventoryPageUseCaseProps = {
        steamID64: '76561198000000000',
        appID: 730,
        contextID: '2',
        config: {
          Language: 'en',
          itemsPerPage: 50,
          tradableOnly: false,
          SteamCommunity_Jar: mockCookieJar,
        },
      };

      const error = new Error('Use case error');
      mockLoadInventoryUseCase.execute.mockRejectedValue(error);

      // Act & Assert
      await expect(loader.load(props)).rejects.toThrow(error);
      expect(mockLoadInventoryUseCase.execute).toHaveBeenCalledWith(props);
    });

    it('should handle empty inventory response', async () => {
      // Arrange
      const props: LoadInventoryPageUseCaseProps = {
        steamID64: '76561198000000000',
        appID: 730,
        contextID: '2',
        config: {
          Language: 'en',
          itemsPerPage: 50,
          tradableOnly: false,
          SteamCommunity_Jar: mockCookieJar,
        },
      };

      const emptyItems: SteamItemEntity[] = [];
      mockLoadInventoryUseCase.execute.mockResolvedValue(emptyItems);

      // Act
      const result = await loader.load(props);

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('inheritance', () => {
    it('should extend IAzulSteamInventoryLoader', () => {
      // Act & Assert
      expect(loader).toBeInstanceOf(AzulSteamInventoryLoader);
      expect(typeof loader.load).toBe('function');
    });
  });
}); 