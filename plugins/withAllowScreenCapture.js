const { withMainActivity } = require("@expo/config-plugins");
const {
  mergeContents,
} = require("@expo/config-plugins/build/utils/generateCode");

/**
 * Clears FLAG_SECURE on startup so Microsoft Teams and other apps
 * can include this app when sharing the device screen.
 * Foreground/resume is handled in JS via expo-screen-capture.
 */
function withAllowScreenCapture(config) {
  return withMainActivity(config, (config) => {
    const contents = config.modResults.contents;

    const result = mergeContents({
      tag: "allow-screen-capture-oncreate",
      src: contents,
      newSrc:
        "    window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)",
      anchor: /super\.onCreate\(/,
      offset: 1,
      comment: "//",
    });

    if (!result.didMerge) {
      throw new Error(
        "Cannot inject allow-screen-capture into MainActivity.onCreate"
      );
    }

    config.modResults.contents = result.contents;
    return config;
  });
}

module.exports = withAllowScreenCapture;
