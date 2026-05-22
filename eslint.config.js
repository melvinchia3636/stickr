// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')

const expoConfig = require('eslint-config-expo/flat')

const prettierPlugin = require('eslint-plugin-prettier')

const prettierConfig = require('eslint-config-prettier')

const unusedImportsPlugin = require('eslint-plugin-unused-imports')

const tsPlugin = require('@typescript-eslint/eslint-plugin')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'node_modules/*']
  },

  // React & JSX Configurations (using existing plugins in expoConfig)
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: true,
          shorthandFirst: true,
          shorthandLast: false,
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: true
        }
      ]
    }
  },

  // Unused Imports & TypeScript Rule Configuration
  {
    plugins: {
      'unused-imports': unusedImportsPlugin,
      prettier: prettierPlugin,
      '@typescript-eslint': tsPlugin
    },
    rules: {
      'prettier/prettier': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_'
        }
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_'
        }
      ]
    }
  },

  // Code Style and Formatting
  {
    rules: {
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'import', next: '*' },
        { blankLine: 'any', prev: 'import', next: 'import' },
        { blankLine: 'always', prev: '*', next: 'const' },
        { blankLine: 'always', prev: 'const', next: '*' },
        { blankLine: 'always', prev: '*', next: 'function' },
        { blankLine: 'always', prev: '*', next: 'class' },
        { blankLine: 'always', prev: '*', next: 'export' },
        { blankLine: 'always', prev: 'export', next: '*' },
        { blankLine: 'always', prev: '*', next: 'block-like' },
        { blankLine: 'always', prev: '*', next: 'return' }
      ]
    }
  },

  // Test Files - Allow explicit any
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },

  prettierConfig
])
