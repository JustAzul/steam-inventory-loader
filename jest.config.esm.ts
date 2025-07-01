import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const esmConfig: Config = {
  clearMocks: true,
  coverageProvider: 'v8',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  preset: 'ts-jest',
  roots: ['<rootDir>'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/presentation/__tests__/facade.spec.ts'],
  transform: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^.+\\.(js|jsx|mjs)$': 'babel-jest',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          ...compilerOptions,
          isolatedModules: true,
        },
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!axios-cookiejar-support/|hpagent/)',
  ],
};

export default esmConfig; 