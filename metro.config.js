const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

let config = getDefaultConfig(__dirname);

// IMPORTANT : Sentry attend (__dirname, config) dans cet ordre
config = getSentryExpoConfig(__dirname, config);

// Appliquer NativeWind ensuite
config = withNativeWind(config, { input: './app/global.css' });

module.exports = config;