const baseConfig = require("./jest.config");

module.exports = {
  testMatch: ["**/tests/integration/**/*.spec.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
