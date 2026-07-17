const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname)

// project CSS lives in ./src/global.css — point nativewind to that file
module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 })