import 'reflect-metadata';
import SteamItemFactory from '@domain/factories/steam-item.factory';
import GetItemMarketFeeAppUseCase from '../get-item-market-fee-app.use-case';
import { inventoryPageResultMock } from './mocks';

describe('Application :: UseCases :: GetItemMarketFeeAppUseCase', () => {
  const useCase = new GetItemMarketFeeAppUseCase();

  it('should return the market fee app ID for a valid Steam community item', () => {
    const asset = {
      appid: 753,
      contextid: '6',
      assetid: '1',
      classid: '123',
      instanceid: '456',
      amount: '1',
    };
    const description = {
      ...inventoryPageResultMock.page1.descriptions[0],
      market_hash_name: '753-Sack of Gems',
    };
    const [item] = SteamItemFactory.createFromInventoryPage([asset], [description]);
    const feeApp = useCase.execute(item);
    expect(feeApp).toBe(753);
  });

  it('should return undefined for an item that does not match the criteria', () => {
    const [item] = SteamItemFactory.createFromInventoryPage(
      inventoryPageResultMock.page1.assets,
      inventoryPageResultMock.page1.descriptions,
    );
    const feeApp = useCase.execute(item);
    expect(feeApp).toBeUndefined();
  });
}); 