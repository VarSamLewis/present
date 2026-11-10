import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Data fetching on mount intentionally sets state after the async call resolves.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;

