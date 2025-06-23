import { rawTag } from '@domain/types/raw-tag.type';

import FindCardBorderTypeUseCase from '../find-card-border-type.use-case';
import FindTagUseCase from '../find-tag.use-case';

describe('Application :: UseCases :: FindCardBorderTypeUseCase', () => {
  let useCase: FindCardBorderTypeUseCase;

  beforeEach(() => {
    // Manually inject the dependency for the test
    const findTagUseCase = new FindTagUseCase();
    useCase = new FindCardBorderTypeUseCase(findTagUseCase);
  });

  const normalCardTags: rawTag[] = [
    {
      category: 'item_class',
      category_name: 'Item Class',
      color: '',
      internal_name: 'item_class_2',
      name: 'Trading Card',
    },
    {
      category: 'cardborder',
      category_name: 'Card Border',
      color: '',
      internal_name: 'cardborder_0',
      name: 'Normal',
    },
  ];

  const foilCardTags: rawTag[] = [
    {
      category: 'item_class',
      category_name: 'Item Class',
      color: '',
      internal_name: 'item_class_2',
      name: 'Trading Card',
    },
    {
      category: 'cardborder',
      category_name: 'Card Border',
      color: '',
      internal_name: 'cardborder_1',
      name: 'Foil',
    },
  ];

  const nonCardTags: rawTag[] = [
    {
      category: 'item_class',
      category_name: 'Item Class',
      color: '',
      internal_name: 'item_class_3',
      name: 'Profile Background',
    },
    {
      category: 'cardborder',
      category_name: 'Card Border',
      color: '',
      internal_name: 'cardborder_0',
      name: 'Normal',
    },
  ];

  const missingBorderTag: rawTag[] = [
    {
      category: 'item_class',
      category_name: 'Item Class',
      color: '',
      internal_name: 'item_class_2',
      name: 'Trading Card',
    },
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
