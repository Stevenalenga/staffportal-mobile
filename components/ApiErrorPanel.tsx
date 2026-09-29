import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/lib/config";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ApiErrorPanel({ message, onRetry }: Props) {
  return (
    <View className="mx-4 my-6 rounded-2xl border border-red-200 bg-red-50 p-4">
      <View className="flex-row items-start gap-3">
        <Ionicons name="cloud-offline-outline" size={22} color="#dc2626" />
        <View className="flex-1">
          <Text className="text-sm font-semibold text-red-900">
            Could not load data
          </Text>
          <Text className="text-sm text-red-800 mt-1">{message}</Text>
          <Text className="text-xs text-red-700/80 mt-2">
            API: {API_BASE_URL}
          </Text>
          {onRetry ? (
            <TouchableOpacity
              onPress={onRetry}
              className="mt-3 self-start rounded-xl bg-red-600 px-4 py-2"
            >
              <Text className="text-sm font-semibold text-white">Try again</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}
