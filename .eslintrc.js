module.exports = {
    env: {
      es2021: true,
      node: true,
    },
    globals: {
      Atomics: "readonly",
      SharedArrayBuffer: "readonly"
    },
    extends: [
      'airbnb-base',
      'plugin:import/errors',
      'plugin:import/warnings',
      'plugin:import/typescript',
      'plugin:prettier/recommended',
    ],
    plugins: ['@typescript-eslint', 'import'],
    parser: '@typescript-eslint/parser',
    rules: {
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          ts: 'never',
        },
      ],
      'import/order': 'off',
      'import/prefer-default-export': 'warn',
    },
    overrides: [
      {
        files: ['*.ts', '*.tsx'],
        extends: [
          'plugin:@typescript-eslint/recommended',
          'plugin:@typescript-eslint/recommended-requiring-type-checking',
        ],
        parserOptions: {
          project: ['./tsconfig.json'],
        },
      },
    ],
  };
  