import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { rawTag } from '@domain/types/raw-tag.type';

import FindTagUseCase, {
  FindTagUseCaseProps,
} from '../find-tag.use-case';

describe('Application :: UseCases :: FindTagUseCase', () => {
  let useCase: FindTagUseCase;
  const execute = (props: FindTagUseCaseProps) => useCase.execute(props);

  beforeEach(() => {
    useCase = new FindTagUseCase();
  });

  const mockTags: rawTag[] = [
    {
      category: 'quality',
      category_name: 'Quality',
      color: 'FFD700',
      internal_name: 'unique',
      name: 'Unique',
    },
    {
      category: 'rarity',
      category_name: 'Rarity',
      color: 'B0C3D9',
      internal_name: 'common',
      name: 'Common',
    },
    {
      category: 'type',
      category_name: 'Type',
      color: 'B0C3D9',
      internal_name: 'weapon',
      name: 'Weapon',
    },
  ];

  it('should find and return a tag when the category exists', () => {
    const result = execute({
      categoryToFind: 'rarity',
      tags: mockTags,
    });
    expect(result).toEqual(mockTags[1]);
  });

  it('should return null when the category does not exist', () => {
    const result = execute({
      categoryToFind: 'nonexistent',
      tags: mockTags,
    });
    expect(result).toBeNull();
  });

  it('should return null when the tags array is empty', () => {
    const result = execute({ categoryToFind: 'rarity', tags: [] });
    expect(result).toBeNull();
  });

  it('should return null when the tags array is null or undefined', () => {
    const result1 = execute({
      categoryToFind: 'rarity',
      tags: null as unknown as Array<rawTag | SteamItemTag>,
    });
    expect(result1).toBeNull();
    const result2 = execute({
      categoryToFind: 'rarity',
      tags: undefined as unknown as Array<rawTag | SteamItemTag>,
    });
    expect(result2).toBeNull();
  });
});
