import {
  DEFAULT_REQUEST_URL,
  PLACEHOLDER_APP_ID,
  PLACEHOLDER_CONTEXT_ID,
  PLACEHOLDER_STEAM_ID_64,
} from '../../../shared/constants';

import GetPageUrlUseCase, { GetPageUrlProps } from './../get-page-url.use-case';

const urlParamsDic = {
  count: 'count',
  l: 'language',
  start_assetid: 'lastAssetID',
};

type UrlParamsDicKeys = keyof typeof urlParamsDic;

function FindParamNameFromConfigKey(
  configKey: keyof Pick<
    Required<GetPageUrlProps>,
    'count' | 'language' | 'lastAssetID'
  >,
): UrlParamsDicKeys {
  return Object.keys(urlParamsDic).find(
    (key) => urlParamsDic[key as UrlParamsDicKeys] === configKey,
  ) as UrlParamsDicKeys;
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

    expect(url.searchParams.get(FindParamNameFromConfigKey('language'))).toBe(
      config.language,
    );

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('count')),
    ).toBeNull();

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('lastAssetID')),
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
      url.searchParams.get(FindParamNameFromConfigKey('language')),
    ).toBeNull();

    expect(url.searchParams.get(FindParamNameFromConfigKey('count'))).toBe(
      String(config.count),
    );

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('lastAssetID')),
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
      url.searchParams.get(FindParamNameFromConfigKey('language')),
    ).toBeNull();
    expect(
      url.searchParams.get(FindParamNameFromConfigKey('count')),
    ).toBeNull();

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('lastAssetID')),
    ).toBe(config.lastAssetID);
  });

  it(`should return a valid URL with language and count`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      count: 10,
      language: 'english',
    };

    const useCase = new GetPageUrlUseCase(config).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(url.searchParams.get(FindParamNameFromConfigKey('language'))).toBe(
      config.language,
    );

    expect(url.searchParams.get(FindParamNameFromConfigKey('count'))).toBe(
      String(config.count),
    );

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('lastAssetID')),
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

    expect(url.searchParams.get(FindParamNameFromConfigKey('language'))).toBe(
      config.language,
    );

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('count')),
    ).toBeNull();

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('lastAssetID')),
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
      url.searchParams.get(FindParamNameFromConfigKey('language')),
    ).toBeNull();

    expect(url.searchParams.get(FindParamNameFromConfigKey('count'))).toBe(
      String(config.count),
    );

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('lastAssetID')),
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

    expect(url.searchParams.get(FindParamNameFromConfigKey('language'))).toBe(
      config.language,
    );

    expect(url.searchParams.get(FindParamNameFromConfigKey('count'))).toBe(
      String(config.count),
    );

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('lastAssetID')),
    ).toBe(config.lastAssetID);
  });

  it(`should return a valid URL`, () => {
    const useCase = new GetPageUrlUseCase(defaultConfig).execute();

    const url = new URL(useCase);
    expect(url).toBeTruthy();

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('language')),
    ).toBeNull();
    expect(
      url.searchParams.get(FindParamNameFromConfigKey('count')),
    ).toBeNull();

    expect(
      url.searchParams.get(FindParamNameFromConfigKey('lastAssetID')),
    ).toBeNull();

    expect(useCase).toContain(
      DEFAULT_REQUEST_URL.replace(
        PLACEHOLDER_STEAM_ID_64,
        defaultConfig.steamID64,
      )
        .replace(PLACEHOLDER_APP_ID, defaultConfig.appID)
        .replace(PLACEHOLDER_CONTEXT_ID, defaultConfig.contextID),
    );
  });

  it(`should thrown an error if customEndpoint does not provides the '${PLACEHOLDER_APP_ID}' template`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      customEndpoint: `https://example.com/${PLACEHOLDER_STEAM_ID_64}/${PLACEHOLDER_CONTEXT_ID}`,
    };

    expect(() => new GetPageUrlUseCase(config).execute()).toThrowError();
  });

  it(`should thrown an error if customEndpoint does not provides the '${PLACEHOLDER_CONTEXT_ID}' template`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      customEndpoint: `https://example.com/${PLACEHOLDER_STEAM_ID_64}/${PLACEHOLDER_APP_ID}`,
    };

    expect(() => new GetPageUrlUseCase(config).execute()).toThrowError();
  });

  it(`should thrown an error if customEndpoint does not provides the '${PLACEHOLDER_STEAM_ID_64}' template`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      customEndpoint: `https://example.com/${PLACEHOLDER_CONTEXT_ID}/${PLACEHOLDER_APP_ID}`,
    };

    expect(() => new GetPageUrlUseCase(config).execute()).toThrowError();
  });

  it(`should thrown an error if customEndpoint does not provides a valid url`, () => {
    const config: GetPageUrlProps = {
      ...defaultConfig,
      customEndpoint: `example.com/${PLACEHOLDER_CONTEXT_ID}/${PLACEHOLDER_APP_ID}`,
    };

    expect(() => new GetPageUrlUseCase(config).execute()).toThrowError();
  });
});
