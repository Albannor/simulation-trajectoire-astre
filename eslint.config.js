import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const PHYSICS = ['src/physics/**/*.ts', 'src/config.ts'];

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    languageOptions: { ecmaVersion: 2022 },
  },
  {
    // Interface : navigateur + React.
    files: ['src/**/*.{ts,tsx}'],
    ignores: PHYSICS,
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // Le module physique (et config.ts) reste pur : aucun global du navigateur,
    // aucune dépendance à React, au rendu, à l'interface ou à la boucle d'animation.
    files: PHYSICS,
    rules: {
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'navigator',
        'localStorage',
        'sessionStorage',
        'requestAnimationFrame',
        'performance',
        'HTMLCanvasElement',
        'CanvasRenderingContext2D',
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react-dom',
            'react/*',
            'react-dom/*',
            '**/ui',
            '**/ui/*',
            '**/render',
            '**/render/*',
            '**/sim',
            '**/sim/*',
            '**/i18n/*',
            '**/format',
            '**/storage',
          ],
        },
      ],
    },
  },
  {
    files: ['*.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
);
