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
          type: 'shared',
          pattern: 'src/shared',
        },
        {
          type: 'main',
          pattern: 'src',
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
              allow: ['domain', 'shared'],
            },
            // Application can import from domain
            {
              from: ['application'],
              allow: ['domain', 'application', 'shared'],
            },
            // Infra can import from application and domain
            {
              from: ['infra'],
              allow: ['application', 'domain', 'infra', 'shared'],
            },
            // Presentation can import from application
            {
              from: ['presentation'],
              allow: ['application', 'presentation', 'shared', 'domain'],
            },
            // Shared can't import from anywhere
            {
              from: ['shared'],
              allow: ['shared'],
            },
            // Main can import from anywhere
            {
              from: ['main'],
              allow: [
                'domain',
                'application',
                'infra',
                'presentation',
                'shared',
                'main',
              ],
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
