import GetPageUrlUseCase, { GetPageUrlProps } from './../get-page-url.use-case';

import { DEFAULT_REQUEST_URL } from '../../../shared/constants';

const urlParamsDic = {
  l: 'language',
  count: 'count',
  start_assetid: 'lastAssetID',
};

function findParamNameFromConfigKey(
  configKey: keyof Pick<
    Required<GetPageUrlProps>,
    'count' | 'language' | 'lastAssetID'
  >,
): keyof typeof urlParamsDic {
  return Object.keys(urlParamsDic).find(
    (key) => urlParamsDic[key as keyof typeof urlParamsDic] === configKey,
  ) as keyof typeof urlParamsDic;
}

describe(GetPageUrlUseCase.name, () => {
  const defaultConfig: GetPageUrlProps = {
    appID: '440',
    contextID: '2',
    steamID64: '76561198000000000',
  };

  it(`should return a valid URL with language`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      language: 'english',
    };

    const useCase = new GetPageUrlUseCase(config).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(url.searchParams.get(findParamNameFromConfigKey('language'))).toBe(
      config.language,
    );

    expect(
      url.searchParams.get(findParamNameFromConfigKey('count')),
    ).toBeNull();

    expect(
      url.searchParams.get(findParamNameFromConfigKey('lastAssetID')),
    ).toBeNull();
  });

  it(`should return a valid URL with count`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      count: 10,
    };

    const useCase = new GetPageUrlUseCase(config).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(
      url.searchParams.get(findParamNameFromConfigKey('language')),
    ).toBeNull();

    expect(url.searchParams.get(findParamNameFromConfigKey('count'))).toBe(
      String(config.count),
    );

    expect(
      url.searchParams.get(findParamNameFromConfigKey('lastAssetID')),
    ).toBeNull();
  });

  it(`should return a valid URL with lastAssetID`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      lastAssetID: '123456789',
    };

    const useCase = new GetPageUrlUseCase(config).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(
      url.searchParams.get(findParamNameFromConfigKey('language')),
    ).toBeNull();
    expect(
      url.searchParams.get(findParamNameFromConfigKey('count')),
    ).toBeNull();

    expect(
      url.searchParams.get(findParamNameFromConfigKey('lastAssetID')),
    ).toBe(config.lastAssetID);
  });

  it(`should return a valid URL with language and count`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      language: 'english',
      count: 10,
    };

    const useCase = new GetPageUrlUseCase(config).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(url.searchParams.get(findParamNameFromConfigKey('language'))).toBe(
      config.language,
    );

    expect(url.searchParams.get(findParamNameFromConfigKey('count'))).toBe(
      String(config.count),
    );

    expect(
      url.searchParams.get(findParamNameFromConfigKey('lastAssetID')),
    ).toBeNull();
  });

  it(`should return a valid URL with language and lastAssetID`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      language: 'english',
      lastAssetID: '123456789',
    };

    const useCase = new GetPageUrlUseCase(config).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(url.searchParams.get(findParamNameFromConfigKey('language'))).toBe(
      config.language,
    );

    expect(
      url.searchParams.get(findParamNameFromConfigKey('count')),
    ).toBeNull();

    expect(
      url.searchParams.get(findParamNameFromConfigKey('lastAssetID')),
    ).toBe(config.lastAssetID);
  });

  it(`should return a valid URL with count and lastAssetID`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      count: 10,
      lastAssetID: '123456789',
    };

    const useCase = new GetPageUrlUseCase(config).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(
      url.searchParams.get(findParamNameFromConfigKey('language')),
    ).toBeNull();

    expect(url.searchParams.get(findParamNameFromConfigKey('count'))).toBe(
      String(config.count),
    );

    expect(
      url.searchParams.get(findParamNameFromConfigKey('lastAssetID')),
    ).toBe(config.lastAssetID);
  });

  it(`should return a valid URL with all params`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      count: 10,
      language: 'english',
      lastAssetID: '123456789',
    };

    const useCase = new GetPageUrlUseCase(config).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(url.searchParams.get(findParamNameFromConfigKey('language'))).toBe(
      config.language,
    );

    expect(url.searchParams.get(findParamNameFromConfigKey('count'))).toBe(
      String(config.count),
    );

    expect(
      url.searchParams.get(findParamNameFromConfigKey('lastAssetID')),
    ).toBe(config.lastAssetID);
  });

  it(`should return a valid URL`, () => {
    const useCase = new GetPageUrlUseCase(defaultConfig).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(
      url.searchParams.get(findParamNameFromConfigKey('language')),
    ).toBeNull();
    expect(
      url.searchParams.get(findParamNameFromConfigKey('count')),
    ).toBeNull();

    expect(
      url.searchParams.get(findParamNameFromConfigKey('lastAssetID')),
    ).toBeNull();

    expect(useCase).toContain(
      DEFAULT_REQUEST_URL.replace('{steamID64}', defaultConfig.steamID64)
        .replace('{appID}', defaultConfig.appID)
        .replace('{contextID}', defaultConfig.contextID),
    );
  });

  it(`should thrown an error if customEndpoint does not provides the '{appID}' template`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      customEndpoint: 'https://example.com/{steamID64}/{contextID}',
    };

    expect(() => new GetPageUrlUseCase(config).execute()).toThrowError();
  });

  it(`should thrown an error if customEndpoint does not provides the '{contextID}' template`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      customEndpoint: 'https://example.com/{steamID64}/{appID}',
    };

    expect(() => new GetPageUrlUseCase(config).execute()).toThrowError();
  });

  it(`should thrown an error if customEndpoint does not provides the '{steamID64}' template`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      customEndpoint: 'https://example.com/{contextID}/{appID}',
    };

    expect(() => new GetPageUrlUseCase(config).execute()).toThrowError();
  });

  it(`should thrown an error if customEndpoint does not provides a valid url`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      customEndpoint: 'example.com/{contextID}/{appID}',
    };

    expect(() => new GetPageUrlUseCase(config).execute()).toThrowError();
  });
});
