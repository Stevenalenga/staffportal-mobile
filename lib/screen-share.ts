import { Platform, PermissionsAndroid } from "react-native";
import { mediaDevices, type MediaStream } from "react-native-webrtc";

export type ScreenSharePermissionStatus =
  | "granted"
  | "denied"
  | "unsupported";

let activeStream: MediaStream | null = null;

/** Android 13+ needs notification permission for the screen-share foreground service. */
export async function ensureScreenShareNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  if (Platform.Version < 33) return true;

  const already = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  if (already) return true;

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    {
      title: "Allow notifications",
      message:
        "Notifications are required while your screen is being shared so Android can show the sharing indicator.",
      buttonPositive: "Allow",
      buttonNegative: "Deny",
    }
  );

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

/**
 * Opens the system screen-capture consent dialog (Android) or in-app capture (iOS).
 * Returns a MediaStream when the user approves; call stopScreenShare() when finished.
 */
export async function requestScreenSharePermission(): Promise<{
  status: ScreenSharePermissionStatus;
  stream: MediaStream | null;
  error?: string;
}> {
  if (Platform.OS === "web") {
    return { status: "unsupported", stream: null, error: "Not available on web." };
  }

  const notificationsOk = await ensureScreenShareNotificationPermission();
  if (!notificationsOk) {
    return {
      status: "denied",
      stream: null,
      error: "Notification permission is required for screen sharing on this device.",
    };
  }

  try {
    stopScreenShare();
    const stream = await mediaDevices.getDisplayMedia({});
    activeStream = stream;
    return { status: "granted", stream };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Screen sharing was not allowed.";
    return {
      status: "denied",
      stream: null,
      error: message,
    };
  }
}

export function stopScreenShare() {
  if (!activeStream) return;
  activeStream.getTracks().forEach((track) => track.stop());
  activeStream = null;
}

export function isScreenShareActive() {
  return activeStream !== null;
}
