const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

let config = getDefaultConfig(__dirname);

// Appliquer la configuration Sentry sur la base par défaut
config = getSentryExpoConfig(config);

// Appliquer ensuite NativeWind
config = withNativeWind(config, { input: './app/global.css' });

module.exports = config;
