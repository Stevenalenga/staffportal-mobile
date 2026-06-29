import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { staffApi, type ApiUser } from "@/lib/api";
import { formatRoleLabel, getInitials, getRoleColor } from "@/lib/utils";

function StaffCard({ item }: { item: ApiUser }) {
  const initials = getInitials(item.name ?? item.email);
  const roleColor = getRoleColor(item.role);

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center gap-3">
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: `${roleColor}20` }}
      >
        <Text className="font-bold text-base" style={{ color: roleColor }}>
          {initials}
        </Text>
      </View>
      <View className="flex-1 min-w-0">
        <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>
          {item.name ?? "No name"}
        </Text>
        <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
          {item.email}
        </Text>
        {item.position && (
          <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>
            {item.position.title}
          </Text>
        )}
      </View>
      <View>
        <View
          className="rounded-full px-2 py-1"
          style={{ backgroundColor: `${roleColor}15` }}
        >
          <Text className="text-xs font-medium" style={{ color: roleColor }}>
            {formatRoleLabel(item.role)}
          </Text>
        </View>
        {item.department && (
          <Text className="text-xs text-gray-400 text-right mt-1">
            {item.department.name}
          </Text>
        )}
      </View>
    </View>
  );
}

export default function StaffScreen() {
  const [search, setSearch] = useState("");
  const { data: staff = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["staff"],
    queryFn: staffApi.list,
  });

  const filtered = staff.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900 mb-3">
          Staff Directory
        </Text>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-10">
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-900 text-sm"
            placeholder="Search staff..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <StaffCard item={item} />}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#047857"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="people-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">
                {search ? "No staff match your search" : "No staff members yet"}
              </Text>
            </View>
          }
          ListHeaderComponent={
            <Text className="text-xs text-gray-400 mb-3">
              {filtered.length} member{filtered.length !== 1 ? "s" : ""}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}
