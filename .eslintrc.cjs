module.exports = {
  env: {
    es2021: true,
    node: true,
    mocha: true,
  },
  parserOptions: {
    ecmaVersion: 2020, // or 2018 for Node 10 compatibility
    sourceType: "module", // for .mjs files; .cjs will still be CommonJS
  },
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  plugins: ["prettier"],
  rules: {
    quotes: [1, "double"],
    "prettier/prettier": "error",
  },
  overrides: [
    {
      files: ["*.cjs"],
      parserOptions: {
        sourceType: "script",
        ecmaVersion: 2020,
      },
    },
    {
      files: ["*.mjs"],
      parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
      },
    },
  ],
};
