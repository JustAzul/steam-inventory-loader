import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { 
      tsconfig: 'tsconfig.test.json',
      useESM: false
    }]
  },
  moduleNameMapper: {
    '@application/(.*)': '<rootDir>/src/application/$1',
    '@domain/(.*)': '<rootDir>/src/domain/$1',
    '@infra/(.*)$': '<rootDir>/src/infra/$1',
    '@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '@shared/(.*)$': '<rootDir>/src/shared/$1',
    '@src/(.*)$': '<rootDir>/src/$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transformIgnorePatterns: [
    '/node_modules/(?!(axios-cookiejar-support|http-cookie-agent|tsyringe|reflect-metadata|ssr-window|dom7)/)',
  ],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/__tests__/**',
    '!src/**/types/**',
    '!src/dependency-container.ts',
    '!src/main.ts',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: 'tsconfig.test.json'
    }
  },
  clearMocks: true,
  coverageProvider: 'v8',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'async-queue.spec.ts'],
};

export default config;
