import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config([
  { ignores: ['dist', 'node_modules', '.github', '*.config.js'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
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
      // Mindre strenge regler for utvikling
      '@typescript-eslint/no-explicit-any': 'warn',
      
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
        }
      ]
    },
  },
])