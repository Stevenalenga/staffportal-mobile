module.exports = {
  expo: {
    name: "Uthabiti Portal",
    slug: "staffportal-mobile",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "uthabitiportal",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#047857",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "org.uthabitiafrica.portal",
      infoPlist: {
        NSMicrophoneUsageDescription:
          "Allow Uthabiti Portal to access your microphone for calls and screen sharing with audio.",
        NSCameraUsageDescription:
          "Allow Uthabiti Portal to access your camera for video support sessions.",
      },
    },
    android: {
      package: "org.uthabitiafrica.portal",
      versionCode: 4,
      adaptiveIcon: {
        backgroundColor: "#047857",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
        "android.permission.POST_NOTIFICATIONS",
      ],
    },
    androidStatusBar: {
      barStyle: "dark-content",
      backgroundColor: "#f9fafb",
      translucent: false,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon.png",
          imageWidth: 220,
          resizeMode: "contain",
          backgroundColor: "#047857",
        },
      ],
      [
        "@config-plugins/react-native-webrtc",
        {
          cameraPermission:
            "Allow Uthabiti Portal to access your camera for video support sessions.",
          microphonePermission:
            "Allow Uthabiti Portal to access your microphone for calls and screen sharing with audio.",
        },
      ],
      "./plugins/withScreenSharePermissions.js",
      "./plugins/withAllowScreenCapture.js",
      "expo-router",
      "expo-status-bar",
      "expo-font",
      "expo-secure-store",
      "expo-image",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "b0f0ba91-57cc-4efe-8424-8b1986050d5f",
      },
      // Surfaced via Constants.expoConfig.extra if needed,
      // but prefer process.env.EXPO_PUBLIC_API_URL directly.
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    },
  },
};
