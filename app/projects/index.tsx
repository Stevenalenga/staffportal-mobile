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
import { useRouter, type Href } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { projectsApi, type ProjectListItem } from "@/lib/api";
import { getProjectStatusStyle } from "@/lib/utils";

function ProjectCard({
  item,
  onPress,
}: {
  item: ProjectListItem;
  onPress: () => void;
}) {
  const status = getProjectStatusStyle(item.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-3">
          <Text
            className="font-semibold text-gray-900 text-sm"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <View className="flex-row items-center gap-2 mt-1.5">
            <View className="bg-emerald-50 rounded-full px-2 py-0.5">
              <Text className="text-emerald-700 text-xs font-mono font-medium">
                {item.code}
              </Text>
            </View>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: status.bg }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: status.color }}
              >
                {status.label}
              </Text>
            </View>
          </View>
        </View>
        {item.unreadUpdates > 0 && (
          <View className="bg-red-500 rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center">
            <Text className="text-white text-xs font-bold">
              {item.unreadUpdates > 99 ? "99+" : item.unreadUpdates}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Ionicons name="people-outline" size={14} color="#9ca3af" />
            <Text className="text-xs text-gray-500">
              {item._count.members} member{item._count.members !== 1 ? "s" : ""}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Ionicons name="chatbubble-outline" size={14} color="#9ca3af" />
            <Text className="text-xs text-gray-500">
              {item._count.updates} update{item._count.updates !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );
}

export default function ProjectsScreen() {
  const router = useRouter();
  const { data: projects = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Projects</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Your membership-scoped projects
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/projects/new" as Href)}
            className="bg-emerald-700 rounded-xl px-3 h-9 items-center justify-center flex-row gap-1"
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white text-sm font-medium">New</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              item={item}
              onPress={() => router.push(`/projects/${item.id}` as Href)}
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
              <Ionicons name="folder-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm text-center px-6">
                No projects yet. Create one or ask to be added as a member.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/projects/new" as Href)}
                className="mt-4 bg-emerald-700 rounded-xl px-4 h-10 items-center justify-center"
              >
                <Text className="text-white text-sm font-medium">
                  New Project
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
