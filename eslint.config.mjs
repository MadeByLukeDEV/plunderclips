import tsParser  from '@typescript-eslint/parser';
import tsPlugin  from '@typescript-eslint/eslint-plugin';
import reactPlugin      from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin       from '@next/eslint-plugin-next';

export default [
  // ── Ignores ──────────────────────────────────────────────────────────────
  {
    ignores: ['.next/**', 'node_modules/**', 'prisma/generated/**'],
  },

  // ── TypeScript + React source ─────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType:  'module',
        ecmaFeatures: { jsx: true },
      },
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      'react':       reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@next/next':  nextPlugin,
    },

    settings: {
      react: { version: 'detect' },
    },

    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any':     'warn',
      '@typescript-eslint/no-unused-vars':      ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // React
      'react/react-in-jsx-scope':  'off',  // not needed in React 17+
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Next.js core web vitals
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
