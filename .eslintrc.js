module.exports = {
  env: {
    browser: false,
    es2020: true,
    commonjs: true,
    node: true,
    'jest/globals': true,
  },
  extends: ['eslint:recommended', 'plugin:jest/recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  plugins: ['prettier', 'jest'],
  rules: {
    'prettier/prettier': 'error',
  },
}
