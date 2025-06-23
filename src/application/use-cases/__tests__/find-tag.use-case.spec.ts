import SteamItemTag from '@domain/entities/steam-item-tag.entity';
import { SteamTag } from '@domain/types/steam-tag.type';
import { Tag } from '@domain/types/tag.interface';
import FindTagUseCase, { FindTagUseCaseProps } from '../find-tag.use-case';

describe('Application :: UseCases :: FindTagUseCase', () => {
  let useCase: FindTagUseCase;
  const execute = (props: FindTagUseCaseProps) => useCase.execute(props);

  beforeEach(() => {
    useCase = new FindTagUseCase();
  });

  const mockTags: SteamTag[] = [
    {
      category: 'quality',
      category_name: 'Quality',
      color: 'FFD700',
      internal_name: 'unique',
      name: 'Unique',
      localized_category_name: 'Quality',
      localized_tag_name: 'Unique',
    },
    {
      category: 'rarity',
      category_name: 'Rarity',
      color: 'B0C3D9',
      internal_name: 'common',
      name: 'Common',
      localized_category_name: 'Rarity',
      localized_tag_name: 'Common',
    },
    {
      category: 'type',
      category_name: 'Type',
      color: 'B0C3D9',
      internal_name: 'weapon',
      name: 'Weapon',
      localized_category_name: 'Type',
      localized_tag_name: 'Weapon',
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

  it('should handle an array of SteamItemTag instances', () => {
    const steamItemTags = mockTags.map((tag) => SteamItemTag.create(tag));
    const result = execute({
      categoryToFind: 'rarity',
      tags: steamItemTags,
    });
    expect(result).toBeInstanceOf(SteamItemTag);
    expect(result).toEqual(steamItemTags[1]);
  });

  it('should return null when the tags array is null or undefined', () => {
    const result1 = execute({
      categoryToFind: 'rarity',
      tags: null as unknown as Tag[],
    });
    expect(result1).toBeNull();
    const result2 = execute({
      categoryToFind: 'rarity',
      tags: undefined as unknown as Tag[],
    });
    expect(result2).toBeNull();
  });
});
