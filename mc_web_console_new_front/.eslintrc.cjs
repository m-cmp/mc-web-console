/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier',
    'plugin:vue/recommended',

  ],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: true,
        useTabs: false,
        tabWidth: 2,
        trailingComma: 'all',
        printWidth: 80,
        bracketSpacing: true,
        arrowParens: 'avoid',
      },
    ],
    'vue/no-unused-vars': 'warn',
    'no-console': 'warn',
    'vue/multi-word-component-names': 'off',
    "no-unused-vars": "warn",
    'vue/singleline-html-element-content-newline' : 'off'
  },
};
