import 'reflect-metadata';
import SteamItemFactory from '@domain/factories/steam-item.factory';
import GetItemCacheExpirationUseCase from '../get-item-cache-expiration.use-case';
import { inventoryPageResultMock } from './mocks';
import SteamItemEntity from '@domain/entities/steam-item.entity';

describe('Application :: UseCases :: GetItemCacheExpirationUseCase', () => {
  const useCase = new GetItemCacheExpirationUseCase();

  it('should return item_expiration if it exists', () => {
    const description = {
      ...inventoryPageResultMock.page1.descriptions[0],
      item_expiration: '2025-01-01T00:00:00Z',
    };
    const [item] = SteamItemFactory.createFromInventoryPage(
      inventoryPageResultMock.page1.assets,
      [description],
    );
    const expiration = useCase.execute(item);
    expect(expiration).toBe('2025-01-01T00:00:00Z');
  });

  it('should calculate expiration from CS:GO owner description', () => {
    const description = {
      ...inventoryPageResultMock.page1.descriptions[0],
      owner_descriptions: [
        {
          type: 'text',
          value: 'Tradable After Jan 01, 2025 (19:00:00) GMT',
        },
      ],
    };
    const [item] = SteamItemFactory.createFromInventoryPage(
      inventoryPageResultMock.page1.assets,
      [description],
    );
    const expiration = useCase.execute(item);
    expect(expiration).toBe('2025-01-01T19:00:00.000Z');
  });

  it('should return undefined if no expiration is found', () => {
    const [item] = SteamItemFactory.createFromInventoryPage(
      inventoryPageResultMock.page2.assets,
      inventoryPageResultMock.page2.descriptions,
    );
    const expiration = useCase.execute(item);
    expect(expiration).toBeUndefined();
  });
}); 