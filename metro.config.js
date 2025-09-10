// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const baseConfig = getDefaultConfig(__dirname);

baseConfig.resolver.useWatchman = false;

const reanimatedConfig = wrapWithReanimatedMetroConfig(baseConfig);

module.exports = withNativeWind(reanimatedConfig, { input: "./global.css" });
