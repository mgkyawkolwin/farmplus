const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withGradleFix(config) {
  return withAppBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Pattern matching the problematic getParentFile() call
    const targetPattern = /rootDir\.getAbsoluteFile\(\)\.getParentFile\(\)\.getAbsolutePath\(\)/g;
    const replacement = "file('..').absolutePath";

    if (contents.match(targetPattern)) {
      config.modResults.contents = contents.replace(targetPattern, replacement);
    } else {
      // Fallback: If exact match isn't found, replace standalone .getParentFile().getAbsolutePath()
      config.modResults.contents = contents.replace(
        /\.getParentFile\(\)\.getAbsolutePath\(\)/g,
        ".parentFile?.absolutePath ?: file('..').absolutePath"
      );
    }

    return config;
  });
};