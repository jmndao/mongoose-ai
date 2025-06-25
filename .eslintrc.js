module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  extends: ["eslint:recommended"],
  root: true,
  env: {
    node: true,
    jest: true,
    es6: true,
  },
  ignorePatterns: [
    ".eslintrc.js",
    "dist/",
    "node_modules/",
    "coverage/",
    "examples/",
    "jest.config.js",
    "*.js",
  ],
  rules: {
    "no-unused-vars": "off", // Handled by TypeScript
    "no-undef": "off", // Handled by TypeScript
    "prefer-const": "error",
    "no-var": "error",
  },
  overrides: [
    {
      files: ["**/*.test.ts", "**/*.spec.ts", "tests/**/*.ts"],
      env: {
        jest: true,
      },
      rules: {
        "no-unused-expressions": "off",
      },
    },
  ],
};
