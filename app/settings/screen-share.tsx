import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  isScreenShareActive,
  requestScreenSharePermission,
  stopScreenShare,
} from "@/lib/screen-share";
import { allowScreenCaptureForMeetings } from "@/lib/allow-screen-capture";

export default function ScreenShareSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(isScreenShareActive());

  const handleRequest = async () => {
    setLoading(true);
    await allowScreenCaptureForMeetings();
    const result = await requestScreenSharePermission();
    setLoading(false);
    setActive(!!result.stream);

    if (result.status === "granted" && result.stream) {
      Alert.alert(
        "Screen sharing enabled",
        Platform.OS === "android"
          ? "Android will show a screen-capture indicator while sharing is active. Tap Stop sharing when you are done."
          : "Screen capture is active for this app session.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Screen sharing not enabled",
      result.error ?? "Permission was denied or cancelled."
    );
  };

  const handleStop = () => {
    stopScreenShare();
    setActive(false);
    Alert.alert("Stopped", "Screen sharing has been turned off.");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">Screen sharing</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Allow the portal to capture your screen when needed
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-blue-950">
            When is this used?
          </Text>
          <Text className="text-xs text-blue-900/80 mt-2">
            Screen sharing may be requested during IT support sessions or training.
            Microsoft Teams and similar apps can show this app when sharing your
            screen — we no longer block capture for security on normal screens.
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <Text className="text-sm font-semibold text-gray-900 mb-2">Status</Text>
          <Text className="text-sm text-gray-600">
            {active
              ? "Screen sharing is currently active on this device."
              : "Screen sharing is not active."}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleRequest}
          disabled={loading || active}
          className={`bg-emerald-700 rounded-xl h-12 items-center justify-center mb-3 ${
            loading || active ? "opacity-70" : ""
          }`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">
              Allow screen sharing
            </Text>
          )}
        </TouchableOpacity>

        {active && (
          <TouchableOpacity
            onPress={handleStop}
            className="bg-red-600 rounded-xl h-12 items-center justify-center"
          >
            <Text className="text-white font-semibold">Stop sharing</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
