import { DEFAULT_REQUEST_URL } from '@domain/constants';

import { getPageUrl, GetPageUrlProps } from '../get-page-url';
import { validateEndpoint } from '../validate-endpoint';

jest.mock('../validate-endpoint', () => ({
  validateEndpoint: jest.fn(),
}));

describe('getPageUrl', () => {
  const baseProps: GetPageUrlProps = {
    appID: '730',
    contextID: '2',
    steamID64: '76561198000000000',
  };

  it('should construct a basic URL correctly', () => {
    const { url, params } = getPageUrl(baseProps);
    expect(url).toBe('https://steamcommunity.com/inventory/76561198000000000/730/2');
    expect(params).toEqual({});
  });

  it('should use a custom endpoint if provided', () => {
    const props = {
      ...baseProps,
      customEndpoint: 'http://myproxy.com/inventory/{steamID64}/{appID}/{contextID}',
    };
    const { url } = getPageUrl(props);
    expect(url).toBe('http://myproxy.com/inventory/76561198000000000/730/2');
  });

  it('should add count to params if provided', () => {
    const props = { ...baseProps, count: 100 };
    const { params } = getPageUrl(props);
    expect(params.count).toBe(100);
  });

  it('should add language to params if provided', () => {
    const props = { ...baseProps, language: 'en' };
    const { params } = getPageUrl(props);
    expect(params.l).toBe('en');
  });

  it('should add lastAssetID to params if provided', () => {
    const props = { ...baseProps, lastAssetID: '12345' };
    const { params } = getPageUrl(props);
    expect(params.start_assetid).toBe('12345');
  });

  it('should handle all optional parameters at once', () => {
    const props = {
      ...baseProps,
      count: 50,
      language: 'fr',
      lastAssetID: '67890',
    };
    const { params } = getPageUrl(props);
    expect(params).toEqual({
      count: 50,
      l: 'fr',
      start_assetid: '67890',
    });
  });

  it('should call validateEndpoint with the correct endpoint', () => {
    getPageUrl(baseProps);
    expect(validateEndpoint).toHaveBeenCalledWith(DEFAULT_REQUEST_URL);
  });
}); 