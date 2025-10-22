import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config([
  { ignores: ['dist', 'dist-ssr', 'dev-dist', 'node_modules', '.github', '*.config.js', '*.config.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Tillat unused parameters med underscore
      '@typescript-eslint/no-unused-vars': [
        'error',
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      // 🔒 TYPE SAFETY ENFORCEMENT - Prevent TypeScript/ESLint errors
      '@typescript-eslint/no-explicit-any': 'error', // Critical: Upgraded from warn to error
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // Helpful but not critical
      '@typescript-eslint/prefer-optional-chain': 'warn', // Helpful but not critical
      '@typescript-eslint/no-unused-expressions': 'warn', // Helpful but not critical
      '@typescript-eslint/no-floating-promises': 'error', // Critical: Catch unhandled promises
      
      // 🚨 ARCHITECTURAL SAFEGUARDS - Prevent regression to forbidden patterns
      'no-restricted-properties': [
        'error',
        {
          object: '*',
          property: 'geojson',
          message: '❌ GeoJSON is FORBIDDEN. Use API-based POI rendering with MapLibre GL Markers instead. See ARCHITECTURE.md'
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value="geojson"]',
          message: '❌ GeoJSON sources are FORBIDDEN. Use API-based POI rendering only. See ARCHITECTURE.md'
        },
        {
          selector: 'CallExpression[callee.object.name="console"][callee.property.name=/^(log|warn|error)$/] > Literal[value=/.*any.*/]',
          message: '🔍 Avoid logging "any" types - use proper TypeScript interfaces instead'
        }
      ],

      // 🔒 REACT HOOKS SAFEGUARDS - Prevent useEffect dependency issues
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error'
    },
  },
])