module.exports = function (api) {
  api.cache(true);
  return {
    // Use require.resolve for all presets/plugins so Expo's internally
    // bundled @babel/core gets absolute paths regardless of cwd
    presets: [require.resolve("babel-preset-expo")],
    plugins: [
      require.resolve("nativewind/babel"),
      require.resolve("react-native-reanimated/plugin"),
    ],
  };
};
