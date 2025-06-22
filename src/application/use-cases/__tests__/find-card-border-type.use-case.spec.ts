import FindCardBorderTypeUseCase from '../find-card-border-type.use-case';

describe('Application :: UseCases :: FindCardBorderTypeUseCase', () => {
  let useCase: FindCardBorderTypeUseCase;

  beforeEach(() => {
    useCase = new FindCardBorderTypeUseCase();
  });

  const normalCardTags = [
    { internal_name: 'item_class_2', category: 'item_class' },
    { internal_name: 'cardborder_0', category: 'cardborder' },
  ];

  const foilCardTags = [
    { internal_name: 'item_class_2', category: 'item_class' },
    { internal_name: 'cardborder_1', category: 'cardborder' },
  ];

  const nonCardTags = [
    { internal_name: 'item_class_3', category: 'item_class' },
    { internal_name: 'cardborder_0', category: 'cardborder' },
  ];

  const missingBorderTag = [
    { internal_name: 'item_class_2', category: 'item_class' },
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