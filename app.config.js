module.exports = {
  expo: {
    name: "Uthabiti Portal",
    slug: "staffportal-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    scheme: "uthabitiportal",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "org.uthabitiafrica.portal",
    },
    android: {
      package: "org.uthabitiafrica.portal",
      adaptiveIcon: {
        backgroundColor: "#047857",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
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
      // Surfaced via Constants.expoConfig.extra if needed,
      // but prefer process.env.EXPO_PUBLIC_API_URL directly.
      apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000",
    },
  },
};
