const globals = require('globals');
const pluginJs = require('@eslint/js');
const tseslint = require('typescript-eslint');
const pluginImport = require('eslint-plugin-import');
const pluginPrettier = require('eslint-config-prettier');
const boundaries = require('eslint-plugin-boundaries');

module.exports = [
  {
    ignores: ['dist', 'node_modules', 'coverage', 'jest.setup.js'],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      import: pluginImport,
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
      'boundaries/elements': [
        {
          type: 'domain',
          pattern: 'src/domain',
        },
        {
          type: 'application',
          pattern: 'src/application',
        },
        {
          type: 'infra',
          pattern: 'src/infra',
        },
        {
          type: 'presentation',
          pattern: 'src/presentation',
        },
        {
          type: 'shared-test',
          pattern: 'src/shared/test',
        },
        {
          type: 'shared',
          pattern: 'src/shared',
        },
      ],
    },
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // Domain can't import from anywhere
            {
              from: ['domain'],
              allow: ['domain', 'shared', 'shared-test'],
            },
            // Application can import from domain
            {
              from: ['application'],
              allow: ['domain', 'application', 'shared', 'shared-test'],
            },
            // Infra can import from domain and application
            {
              from: ['infra'],
              allow: ['domain', 'application', 'infra', 'shared'],
            },
            // Presentation can import from application
            {
              from: ['presentation'],
              allow: ['application', 'domain', 'presentation', 'shared'],
            },
            // Shared can't import from anywhere
            {
              from: ['shared'],
              allow: ['shared'],
            },
            {
              from: ['shared-test'],
              allow: ['domain', 'shared-test', 'shared'],
            },
          ],
        },
      ],
      'import/order': [
        'error',
        {
          alphabetize: {
            caseInsensitive: true,
            order: 'asc',
          },
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
];
