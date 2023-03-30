import GetPageUrlUseCase, {
  GetPageUrlProps,
} from '../application/use-cases/get-page-url.use-case';

import { DEFAULT_REQUEST_URL } from '../shared/constants';

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

    const useCase = GetPageUrlUseCase.execute(config);

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

    const useCase = GetPageUrlUseCase.execute(config);

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

    const useCase = GetPageUrlUseCase.execute(config);

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

    const useCase = GetPageUrlUseCase.execute(config);

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

    const useCase = GetPageUrlUseCase.execute(config);

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

    const useCase = GetPageUrlUseCase.execute(config);

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

    const useCase = GetPageUrlUseCase.execute(config);

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
    const useCase = GetPageUrlUseCase.execute(defaultConfig);

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
});
