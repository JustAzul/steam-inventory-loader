import FindTagUseCase from '../find-tag.use-case';
import { rawTag } from '@domain/types/raw-tag.type';

describe('Application :: UseCases :: FindTagUseCase', () => {
  let useCase: FindTagUseCase;

  beforeEach(() => {
    useCase = new FindTagUseCase();
  });

  const mockTags: rawTag[] = [
    { category: 'quality', internal_name: 'unique', category_name: 'Quality', name: 'Unique', color: 'FFD700' },
    { category: 'rarity', internal_name: 'common', category_name: 'Rarity', name: 'Common', color: 'B0C3D9' },
    { category: 'type', internal_name: 'weapon', category_name: 'Type', name: 'Weapon', color: 'B0C3D9' },
  ];

  it('should find and return a tag when the category exists', () => {
    const result = useCase.execute({ tags: mockTags, categoryToFind: 'rarity' });
    expect(result).toEqual(mockTags[1]);
  });

  it('should return null when the category does not exist', () => {
    const result = useCase.execute({ tags: mockTags, categoryToFind: 'nonexistent' });
    expect(result).toBeNull();
  });

  it('should return null when the tags array is empty', () => {
    const result = useCase.execute({ tags: [], categoryToFind: 'rarity' });
    expect(result).toBeNull();
  });

  it('should return null when the tags array is null or undefined', () => {
    const result1 = useCase.execute({ tags: null as any, categoryToFind: 'rarity' });
    expect(result1).toBeNull();
    const result2 = useCase.execute({ tags: undefined as any, categoryToFind: 'rarity' });
    expect(result2).toBeNull();
  });
}); 