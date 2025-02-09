const baseConfig = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css|less|scss)$": "identity-obj-proxy",
    "^.+\\.svg$": "jest-transformer-svg",
  },
  moduleDirectories: ["node_modules", "src"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};

const aliases = ["icons", "utils/firebase"];

const dynamicModuleNameMapper = {};
aliases.forEach((alias) => {
  dynamicModuleNameMapper[`^${alias}(.*)$`] = `<rootDir>/src/${alias}/$1`;
});

module.exports = {
  ...baseConfig,
  moduleNameMapper: {
    ...dynamicModuleNameMapper,
  },
};
