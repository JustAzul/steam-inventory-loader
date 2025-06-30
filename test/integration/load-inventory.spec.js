import 'reflect-metadata';
import { container } from 'tsyringe';
import { LoadInventoryUseCase } from '../../src/application/use-cases/load-inventory.use-case';
import { registerAllDependencies } from '../../src/dependency-container';
import { SteamItem } from '../../src/domain/entities/steam-item.entity';
import { SteamItemPresenter } from '@presentation/presenters/steam-item.presenter';
describe('LoadInventoryUseCase (Integration)', () => {
    beforeAll(() => {
        registerAllDependencies();
    });
    it('should load a real inventory from Steam and present it', async () => {
        const loadInventoryUseCase = container.resolve(LoadInventoryUseCase);
        const steamId = '76561197960435530';
        const appId = 440;
        const contextId = '2';
        const inventory = await loadInventoryUseCase.execute({
            steamId,
            appId,
            contextId
        });
        expect(inventory).toBeInstanceOf(Array);
        expect(inventory.length).toBeGreaterThan(0);
        inventory.forEach((item) => {
            expect(item).toBeInstanceOf(SteamItem);
            expect(typeof item.assetId).toBe('string');
            expect(item.appId).toBe(appId);
            expect(item.contextId).toBe(contextId);
            const presenter = new SteamItemPresenter(item);
            const presentedItem = presenter.present();
            expect(typeof presentedItem.image).toBe('string');
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZC1pbnZlbnRvcnkuc3BlYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxvYWQtaW52ZW50b3J5LnNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxrQkFBa0IsQ0FBQztBQUMxQixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHlEQUF5RCxDQUFDO0FBQy9GLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQ3pFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw2Q0FBNkMsQ0FBQztBQUN4RSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSwrQ0FBK0MsQ0FBQztBQUVuRixRQUFRLENBQUMsb0NBQW9DLEVBQUUsR0FBRyxFQUFFO0lBQ2xELFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYix1QkFBdUIsRUFBRSxDQUFDO0lBQzVCLENBQUMsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUNBLHdEQUF3RCxFQUN4RCxLQUFLLElBQUksRUFBRTtRQUNULE1BQU0sb0JBQW9CLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRXJFLE1BQU0sT0FBTyxHQUFHLG1CQUFtQixDQUFDO1FBQ3BDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQztRQUNsQixNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUM7UUFFdEIsTUFBTSxTQUFTLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7WUFDbkQsT0FBTztZQUNQLEtBQUs7WUFDTCxTQUFTO1NBQ1YsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN4QyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQy9CLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sU0FBUyxHQUFHLElBQUksa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDL0MsTUFBTSxhQUFhLEdBQUcsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDcEQsQ0FBQyxDQUFDLENBQUM7SUFDUixDQUFDLEFBRE8sQ0FBQSxDQUFBO0FBQ1IsQ0FBQyxBQURPLENBQUEsQ0FBQSJ9