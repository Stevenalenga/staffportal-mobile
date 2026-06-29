import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { tasksApi } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/utils";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  project: { name: string; code: string } | null;
  assignee: { name: string | null } | null;
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  LOW: { color: "#6b7280", bg: "#f9fafb" },
  MEDIUM: { color: "#2563eb", bg: "#eff6ff" },
  HIGH: { color: "#ea580c", bg: "#fff7ed" },
  URGENT: { color: "#dc2626", bg: "#fef2f2" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  TODO: { label: "To Do", color: "#6b7280" },
  IN_PROGRESS: { label: "In Progress", color: "#2563eb" },
  REVIEW: { label: "Review", color: "#ca8a04" },
  DONE: { label: "Done", color: "#047857" },
  CANCELLED: { label: "Cancelled", color: "#dc2626" },
};

function TaskCard({ item }: { item: Task }) {
  const priority = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.MEDIUM;
  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.TODO;
  const isOverdue =
    item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "DONE";

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-start justify-between mb-2">
        <View
          className="rounded-full px-2 py-0.5"
          style={{ backgroundColor: priority.bg }}
        >
          <Text className="text-xs font-medium" style={{ color: priority.color }}>
            {item.priority}
          </Text>
        </View>
        <Text className="text-xs font-medium" style={{ color: status.color }}>
          {status.label}
        </Text>
      </View>
      <Text className="font-semibold text-gray-900 text-sm mb-1">
        {item.title}
      </Text>
      {item.description && (
        <Text className="text-gray-500 text-xs mb-2" numberOfLines={2}>
          {item.description}
        </Text>
      )}
      <View className="flex-row items-center gap-3 flex-wrap mt-1">
        {item.project && (
          <View className="flex-row items-center gap-1">
            <Ionicons name="folder-outline" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-400 font-mono">
              {item.project.code}
            </Text>
          </View>
        )}
        {item.dueDate && (
          <View className="flex-row items-center gap-1">
            <Ionicons
              name="calendar-outline"
              size={12}
              color={isOverdue ? "#dc2626" : "#9ca3af"}
            />
            <Text
              className="text-xs"
              style={{ color: isOverdue ? "#dc2626" : "#9ca3af" }}
            >
              {formatDate(item.dueDate)}
            </Text>
          </View>
        )}
        {item.assignee?.name && (
          <View className="flex-row items-center gap-1">
            <View className="w-4 h-4 rounded-full bg-emerald-100 items-center justify-center">
              <Text className="text-emerald-700 font-bold" style={{ fontSize: 8 }}>
                {getInitials(item.assignee.name)}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">{item.assignee.name}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function TasksScreen() {
  const { data: tasks = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["tasks"],
    queryFn: tasksApi.list,
  });

  const urgent = tasks.filter((t: Task) => t.priority === "URGENT").length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">My Tasks</Text>
          <TouchableOpacity className="bg-emerald-700 rounded-xl px-4 h-9 items-center justify-center flex-row gap-1.5">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white text-sm font-medium">New Task</Text>
          </TouchableOpacity>
        </View>
        {urgent > 0 && (
          <View className="mt-3 bg-red-50 rounded-xl px-3 py-2 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text className="text-red-700 text-xs font-medium">
              {urgent} urgent task{urgent !== 1 ? "s" : ""} need attention
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item: Task) => item.id}
          renderItem={({ item }) => <TaskCard item={item} />}
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
              <Ionicons name="checkbox-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">
                No open tasks
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
