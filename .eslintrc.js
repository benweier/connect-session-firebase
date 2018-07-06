module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:jest/recommended",
    "airbnb-base",
    "prettier"
  ],
  env: {
    browser: false,
    es6: true,
    jest: true,
    node: true
  },
  plugins: [
    "jest",
    "prettier"
  ],
  rules: {
    "prettier/prettier": "error"
  }
}
