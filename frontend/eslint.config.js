import js from "@eslint/js";
import react from "eslint-plugin-react";

export default [
  js.configs.recommended,
  {
    files: ["**/*.jsx", "**/*.js"],
    plugins: {
      react,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        fetch: "readonly",
        navigator: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        AbortController: "readonly",
        Image: "readonly",
        FileReader: "readonly",
        alert: "readonly",
        confirm: "readonly",
        QRCode: "readonly",
        process: "readonly",
        URL: "readonly",
        TextEncoder: "readonly",
        Uint8Array: "readonly",
        Promise: "readonly",
        // Common JS/React globals
        React: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
      "react/jsx-no-undef": "error",
      "no-unused-vars": "warn",
    },
  },
];
