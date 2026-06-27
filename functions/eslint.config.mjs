import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["/lib/**", "/generated/**"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
    },
    rules: {
      quotes: ["error", "double"],
      indent: ["error", 2],
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];
