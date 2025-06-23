import { STEAM_CDN_IMAGE_URL } from '@domain/constants';

import GetImageUrlUseCase from '../get-image-url.use-case';

describe('Application :: UseCases :: GetImageUrlUseCase', () => {
  let useCase: GetImageUrlUseCase;

  beforeEach(() => {
    useCase = new GetImageUrlUseCase();
  });

  it('should return the normal icon_url when size is not specified', () => {
    const input = { icon_url: 'normal_icon.jpg' };
    const expectedUrl = `${STEAM_CDN_IMAGE_URL}/${input.icon_url}`;
    const result = useCase.execute({ input });
    expect(result).toBe(expectedUrl);
  });

  it('should return the normal icon_url when size is "normal"', () => {
    const input = { icon_url: 'normal_icon.jpg' };
    const expectedUrl = `${STEAM_CDN_IMAGE_URL}/${input.icon_url}`;
    const result = useCase.execute({ input, size: 'normal' });
    expect(result).toBe(expectedUrl);
  });

  it('should return the large icon_url when size is "large" and icon_url_large is present', () => {
    const input = {
      icon_url: 'normal_icon.jpg',
      icon_url_large: 'large_icon.jpg',
    };
    const expectedUrl = `${STEAM_CDN_IMAGE_URL}/${input.icon_url_large}`;
    const result = useCase.execute({ input, size: 'large' });
    expect(result).toBe(expectedUrl);
  });

  it('should fall back to normal icon_url when size is "large" but icon_url_large is missing', () => {
    const input = { icon_url: 'normal_icon.jpg' };
    const expectedUrl = `${STEAM_CDN_IMAGE_URL}/${input.icon_url}`;
    const result = useCase.execute({ input, size: 'large' });
    expect(result).toBe(expectedUrl);
  });
});
