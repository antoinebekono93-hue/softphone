const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const packagesRoot = path.resolve(projectRoot, "../../packages");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [packagesRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(projectRoot, "../../node_modules"),
];

module.exports = config;
