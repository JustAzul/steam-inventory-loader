module.exports = {
  ignorePatterns: ['jest.config.ts', 'dist', 'node_modules', '.eslintrc.js'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  plugins: [
    '@typescript-eslint',
    'prettier',
    'import',
    'boundaries',
    'sort-keys',
  ],
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
    'boundaries/elements': [
      {
        type: 'domain',
        pattern: 'src/domain/**/*',
      },
      {
        type: 'application',
        pattern: 'src/application/**/*',
      },
      {
        type: 'infra',
        pattern: 'src/infra/**/*',
      },
      {
        type: 'shared',
        pattern: 'src/shared/**/*',
      },
      {
        type: 'presentation',
        pattern: 'src/presentation/**/*',
      },
    ],
    'boundaries/ignore': ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**/*'],
  },
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',

    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-non-null-assertion': 'error',
    '@typescript-eslint/prefer-readonly': 'error',
    '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Can be too strict
    '@typescript-eslint/strict-boolean-expressions': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/return-await': ['error', 'always'],

    // Naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'default',
        format: ['camelCase'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
        leadingUnderscore: 'allow',
      },
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      {
        selector: 'interface',
        format: ['PascalCase'],
        prefix: ['I'],
      },
      {
        selector: 'enum',
        format: ['PascalCase'],
      },
      {
        selector: 'enumMember',
        format: ['UPPER_CASE'],
      },
      {
        selector: 'class',
        format: ['PascalCase'],
      },
      {
        selector: 'method',
        format: ['camelCase'],
      },
      {
        selector: 'function',
        format: ['camelCase'],
      },
      {
        selector: 'parameter',
        format: ['camelCase'],
        leadingUnderscore: 'allow',
      },
    ],

    // Clean Architecture boundaries
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          {
            from: 'domain',
            allow: ['domain', 'shared'],
          },
          {
            from: 'application',
            allow: ['domain', 'application', 'shared'],
          },
          {
            from: 'infra',
            allow: ['domain', 'application', 'infra', 'shared'],
          },
          {
            from: 'presentation',
            allow: ['domain', 'application', 'shared'],
          },
          {
            from: 'shared',
            allow: ['shared'],
          },
        ],
      },
    ],

    // Import rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-useless-path-segments': 'error',
    'import/no-duplicates': 'error',

    // Code quality rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-void': 'error',
    'no-with': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-shadow': 'off', // Use TypeScript version
    '@typescript-eslint/no-shadow': 'error',

    // Complexity rules
    complexity: ['error', { max: 10 }],
    'max-lines': ['error', { max: 300, skipComments: true, skipBlankLines: true }],
    'max-lines-per-function': ['error', { max: 50, skipComments: true, skipBlankLines: true }],
    'max-params': ['error', { max: 4 }],
    'max-depth': ['error', { max: 4 }],
    'max-nested-callbacks': ['error', { max: 3 }],

    // Object and array rules
    'sort-keys/sort-keys-fix': 'error',
    'object-shorthand': 'error',
    'prefer-destructuring': [
      'error',
      {
        object: true,
        array: false,
      },
    ],

    // Best practices
    eqeqeq: ['error', 'always'],
    'no-param-reassign': 'error',
    'no-return-assign': 'error',
    'no-sequences': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'prefer-promise-reject-errors': 'error',
    radix: 'error',
    'require-await': 'off', // Use TypeScript version
  },
  overrides: [
    // Test files have relaxed rules
    {
      files: ['**/*.spec.ts', '**/*.test.ts', '**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        complexity: 'off',
      },
    },
    // Type definition files
    {
      files: ['**/*.d.ts'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'import/no-duplicates': 'off',
      },
    },
    // Configuration files
    {
      files: ['*.config.{js,ts}', '*.setup.{js,ts}'],
      rules: {
        'import/no-default-export': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
}; 