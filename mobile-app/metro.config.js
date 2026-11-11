const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// تعطيل SSR لتجنب مشاكل expo-router على الويب
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
