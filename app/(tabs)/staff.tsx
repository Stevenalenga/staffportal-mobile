import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useRouter, type Href } from "expo-router";
import { departmentsApi, staffApi, type ApiUser } from "@/lib/api";
import { formatRoleLabel, getInitials, getRoleColor } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  canViewStaffDirectory,
  isItAdmin,
} from "@/lib/portal-access";

function StaffCard({
  item,
  showRoleAction,
  onPress,
}: {
  item: ApiUser;
  showRoleAction: boolean;
  onPress?: () => void;
}) {
  const initials = getInitials(item.name ?? item.email);
  const roleColor = getRoleColor(item.role);

  const content = (
    <View className="flex-row items-center gap-3 flex-1">
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
        {showRoleAction && (
          <Text className="text-[10px] text-emerald-700 text-right mt-1 font-medium">
            Edit role
          </Text>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      {content}
    </View>
  );
}

export default function StaffScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const viewDirectory = canViewStaffDirectory(user?.role);
  const itAdmin = isItAdmin(user?.role);

  const { data: staff = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["staff"],
    queryFn: staffApi.list,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
    enabled: viewDirectory,
  });

  const filtered = useMemo(() => {
    return staff.filter((s) => {
      const matchesSearch =
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        s.department?.name.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (!departmentFilter) return true;

      return (
        s.department?.id === departmentFilter ||
        s.department?.name === departmentFilter
      );
    });
  }, [staff, search, departmentFilter]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900 mb-1">
          {viewDirectory ? "Staff Directory" : "My profile"}
        </Text>
        {!viewDirectory && (
          <Text className="text-xs text-gray-500 mb-3">
            You can view your own staff record here. Contact HR or IT for directory
            access.
          </Text>
        )}

        {viewDirectory && (
          <>
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-10 mb-0">
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

            {departments.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
                contentContainerStyle={{ gap: 8 }}
              >
                <TouchableOpacity
                  onPress={() => setDepartmentFilter("")}
                  className={`rounded-full px-3 py-1.5 border ${
                    !departmentFilter
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      !departmentFilter ? "text-emerald-700" : "text-gray-600"
                    }`}
                  >
                    All
                  </Text>
                </TouchableOpacity>
                {departments.map((dept) => {
                  const active =
                    departmentFilter === dept.id ||
                    departmentFilter === dept.name;
                  return (
                    <TouchableOpacity
                      key={dept.id}
                      onPress={() => setDepartmentFilter(dept.id)}
                      className={`rounded-full px-3 py-1.5 border ${
                        active
                          ? "border-emerald-600 bg-emerald-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          active ? "text-emerald-700" : "text-gray-600"
                        }`}
                      >
                        {dept.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <StaffCard
              item={item}
              showRoleAction={itAdmin && item.id !== user?.id}
              onPress={
                itAdmin && item.id !== user?.id
                  ? () => router.push(`/staff/${item.id}/role` as Href)
                  : undefined
              }
            />
          )}
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
                {viewDirectory && (search || departmentFilter)
                  ? "No staff match your filters"
                  : "No staff record found"}
              </Text>
            </View>
          }
          ListHeaderComponent={
            viewDirectory ? (
              <Text className="text-xs text-gray-400 mb-3">
                {filtered.length} member{filtered.length !== 1 ? "s" : ""}
                {itAdmin ? " · Tap a member to change role" : ""}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
