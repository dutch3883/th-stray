module.exports = {
  root: true,               // stop ESLint from looking in parent folders
  env: {
    browser: true,
    node:    true,
    es2021:  true,
  },
  parser: '@typescript-eslint/parser',  // so ESLint can read TS
  parserOptions: {
    ecmaVersion: 12,        // allow modern ECMAScript features
    sourceType: 'module',   // allow import/export
    project: './tsconfig.json',  // needed for certain TS rules
  },
  extends: [
    'eslint:recommended',           // basic JS rules
    'plugin:@typescript-eslint/recommended',  // TS rules
    'plugin:prettier/recommended',  // run Prettier as an ESLint rule
  ],
  plugins: [
    '@typescript-eslint', // TS-specific linting rules
    'prettier',           // shows formatting errors as ESLint errors
  ],
  rules: {
    // override or add rules here:
    'prettier/prettier': 'error',      // fail on Prettier violations
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    // etc.
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // TS‑only overrides
      },
    },
    {
      files: ['*.js'],
      rules: {
        // JS‑only overrides
      },
    },
  ],
};
