import FindCardBorderTypeUseCase from '../find-card-border-type.use-case';
import FindTagUseCase from '../find-tag.use-case';
import { rawTag } from '@domain/types/raw-tag.type';

describe('Application :: UseCases :: FindCardBorderTypeUseCase', () => {
  let useCase: FindCardBorderTypeUseCase;

  beforeEach(() => {
    // Manually inject the dependency for the test
    const findTagUseCase = new FindTagUseCase();
    useCase = new FindCardBorderTypeUseCase(findTagUseCase);
  });

  const normalCardTags: rawTag[] = [
    { category: 'item_class', internal_name: 'item_class_2', category_name: 'Item Class', name: 'Trading Card', color: '' },
    { category: 'cardborder', internal_name: 'cardborder_0', category_name: 'Card Border', name: 'Normal', color: '' },
  ];

  const foilCardTags: rawTag[] = [
    { category: 'item_class', internal_name: 'item_class_2', category_name: 'Item Class', name: 'Trading Card', color: '' },
    { category: 'cardborder', internal_name: 'cardborder_1', category_name: 'Card Border', name: 'Foil', color: '' },
  ];

  const nonCardTags: rawTag[] = [
    { category: 'item_class', internal_name: 'item_class_3', category_name: 'Item Class', name: 'Profile Background', color: '' },
    { category: 'cardborder', internal_name: 'cardborder_0', category_name: 'Card Border', name: 'Normal', color: '' },
  ];

  const missingBorderTag: rawTag[] = [
    { category: 'item_class', internal_name: 'item_class_2', category_name: 'Item Class', name: 'Trading Card', color: '' },
  ];

  it('should return "Normal" for a normal trading card', () => {
    const result = useCase.execute({ tags: normalCardTags });
    expect(result).toBe('Normal');
  });

  it('should return "Foil" for a foil trading card', () => {
    const result = useCase.execute({ tags: foilCardTags });
    expect(result).toBe('Foil');
  });

  it('should return null if it is not a trading card (wrong item_class)', () => {
    const result = useCase.execute({ tags: nonCardTags });
    expect(result).toBeNull();
  });

  it('should return null if it is a trading card but has no border tag', () => {
    const result = useCase.execute({ tags: missingBorderTag });
    expect(result).toBeNull();
  });

  it('should return null for an empty tags array', () => {
    const result = useCase.execute({ tags: [] });
    expect(result).toBeNull();
  });
}); 