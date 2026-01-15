import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        alert: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        HTMLCanvasElement: 'readonly',
        Image: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        Math: 'readonly',
        Date: 'readonly',
        Game: 'writable',
        Player: 'writable',
        Enemy: 'writable',
        UIManager: 'writable',
        SpriteAnimator: 'writable',
        GameObjects: 'writable',
        Bullet: 'writable',
        ExpOrb: 'writable',
        REWARD_TYPES: 'readonly',
        CONFIG: 'readonly'
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      'prettier/prettier': 'error',

      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      'no-console': 'warn',
      'eqeqeq': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',

      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',

      'no-magic-numbers': ['warn', {
        'ignore': [0, 1, -1, 2, 10, 100, 1000],
        'ignoreArrayIndexes': true
      }],
      'prefer-const': 'error',
      'no-var': 'error',

      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-duplicate-case': 'error'
    }
  }
];
