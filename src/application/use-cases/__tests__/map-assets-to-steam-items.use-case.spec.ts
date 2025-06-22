import SteamItemEntity from '@domain/entities/steam-item.entity';
import MapAssetsToSteamItemsUseCase from '../map-assets-to-steam-items.use-case';
import { inventoryPageResultMock } from './mocks';

describe('Application :: UseCases :: MapAssetsToSteamItemsUseCase', () => {
  it('should correctly map assets and descriptions to SteamItemEntity objects', () => {
    const useCase = new MapAssetsToSteamItemsUseCase();
    const { assets, descriptions } = inventoryPageResultMock.page1;

    const result = useCase.execute({ assets, descriptions });

    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(SteamItemEntity);
    expect(result[0].assetid).toBe('1');
    expect(result[0].market_hash_name).toBe(
      'Operation Breakout Weapon Case',
    );
    expect(result[0].tradable).toBe(true);
  });

  it('should return an empty array if assets or descriptions are missing', () => {
    const useCase = new MapAssetsToSteamItemsUseCase();

    const result1 = useCase.execute({ assets: [], descriptions: [] });
    expect(result1).toEqual([]);

    const result2 = useCase.execute({
      assets: inventoryPageResultMock.page1.assets,
      descriptions: [],
    });
    expect(result2).toEqual([]);
  });
}); 