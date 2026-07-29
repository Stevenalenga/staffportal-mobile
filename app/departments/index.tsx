import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { departmentsApi, type Department } from "@/lib/api";

function DepartmentCard({ item }: { item: Department }) {
  const preview = item.staff.slice(0, 5);
  const extra = Math.max(0, item._count.staff - preview.length);

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text className="font-semibold text-gray-900 text-sm">{item.name}</Text>
          <View className="flex-row items-center gap-2 mt-1.5">
            <View className="bg-emerald-50 rounded-full px-2 py-0.5">
              <Text className="text-emerald-700 text-xs font-mono font-medium">
                {item.code}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="people-outline" size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-500">
                {item._count.staff} staff
              </Text>
            </View>
          </View>
        </View>
        <View className="w-10 h-10 rounded-xl bg-emerald-50 items-center justify-center">
          <Ionicons name="business-outline" size={18} color="#047857" />
        </View>
      </View>

      {item.head ? (
        <View className="flex-row items-center gap-1.5 mb-2">
          <Ionicons name="person-outline" size={13} color="#6b7280" />
          <Text className="text-xs text-gray-600">
            Head: {item.head.name ?? item.head.email}
          </Text>
        </View>
      ) : (
        <Text className="text-xs text-gray-400 mb-2">No department head set</Text>
      )}

      {item.description ? (
        <Text className="text-sm text-gray-600 mb-3" numberOfLines={3}>
          {item.description}
        </Text>
      ) : null}

      {preview.length > 0 ? (
        <View className="pt-2 border-t border-gray-50">
          <Text className="text-xs font-medium text-gray-500 mb-1.5">
            Staff preview
          </Text>
          <Text className="text-xs text-gray-600" numberOfLines={2}>
            {preview.map((s) => s.name ?? s.email).join(", ")}
            {extra > 0 ? ` +${extra} more` : ""}
          </Text>
        </View>
      ) : (
        <Text className="text-xs text-gray-400 pt-2 border-t border-gray-50">
          No staff assigned
        </Text>
      )}
    </View>
  );
}

export default function DepartmentsScreen() {
  const router = useRouter();
  const {
    data: departments = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

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
          <Text className="text-xl font-bold text-gray-900">Departments</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Organisation structure (read-only)
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          data={departments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DepartmentCard item={item} />}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#047857"
            />
          }
          ListHeaderComponent={
            departments.length > 0 ? (
              <Text className="text-xs text-gray-400 mb-3">
                {departments.length} department
                {departments.length !== 1 ? "s" : ""}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="business-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm text-center px-8">
                No departments yet. Seed departments from the web portal to get
                started.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
