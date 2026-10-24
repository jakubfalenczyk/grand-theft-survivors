import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['node_modules/**', 'dist/**', 'test-results/**', 'playwright-report/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }] },
  },
  {
    files: ['**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
  {
    files: ['src/game/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'document', 'window'],
      'no-restricted-imports': ['error', { patterns: ['**/ui/**', '**/app/**'] }],
    },
  },
  {
    files: ['src/shared/**/*.ts'],
    rules: {
      'no-restricted-globals': ['error', 'document', 'window'],
      'no-restricted-imports': [
        'error',
        { patterns: ['phaser', '**/game/**', '**/ui/**', '**/app/**', '**/theme/**'] },
      ],
    },
  },
  {
    files: ['src/ui/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['phaser', '**/scenes/**', '**/app/**'] }],
    },
  },
  {
    files: ['src/game/features/world/generateCity.ts', 'src/game/camera/projection.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['phaser', '**/scenes/**', '**/*Renderer.ts'] },
      ],
    },
  },
];
