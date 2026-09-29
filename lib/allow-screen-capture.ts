import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";

/** Clears Android FLAG_SECURE so Teams/Meet can show this app while screen sharing. */
export async function allowScreenCaptureForMeetings() {
  if (Platform.OS === "web") return;

  try {
    await ScreenCapture.allowScreenCaptureAsync();
  } catch {
    // Non-fatal: older builds or unsupported platforms.
  }
}

/** Keep screen capture allowed whenever the app is in the foreground. */
export function useAllowScreenCapture() {
  useEffect(() => {
    allowScreenCaptureForMeetings();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        allowScreenCaptureForMeetings();
      }
    });

    return () => subscription.remove();
  }, []);
}
