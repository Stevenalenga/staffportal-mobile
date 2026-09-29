const {
  withAndroidManifest,
  AndroidConfig,
} = require("@expo/config-plugins");

const PERMISSIONS = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
  "android.permission.POST_NOTIFICATIONS",
];

/**
 * Ensures Android screen-share / media projection permissions are declared.
 * react-native-webrtc adds most of this; this plugin fills any gaps for EAS builds.
 */
function withScreenSharePermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    AndroidConfig.Permissions.ensurePermissions(manifest, PERMISSIONS);
    return config;
  });
}

module.exports = withScreenSharePermissions;
