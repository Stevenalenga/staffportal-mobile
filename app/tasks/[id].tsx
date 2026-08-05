import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi, type PersonalTask } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const STATUS_OPTIONS = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "CANCELLED",
] as const;

export default function TaskDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: task, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.get(id!),
    enabled: !!id,
  });

  const [title, setTitle] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const displayTitle = title ?? task?.title ?? "";
  const displayDescription =
    description ?? task?.description ?? "";

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["task", id] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof tasksApi.update>[1]) =>
      tasksApi.update(id!, payload),
    onSuccess: async () => {
      setTitle(null);
      setDescription(null);
      await invalidate();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert("Error", e?.response?.data?.error ?? "Update failed.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.remove(id!),
    onSuccess: async () => {
      await invalidate();
      router.back();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert("Error", e?.response?.data?.error ?? "Delete failed.");
    },
  });

  const saveFields = () => {
    if (!task) return;
    const nextTitle = displayTitle.trim();
    if (!nextTitle) {
      Alert.alert("Required", "Title cannot be empty.");
      return;
    }
    updateMutation.mutate({
      title: nextTitle,
      description: displayDescription.trim() || undefined,
    });
  };

  const setStatus = (status: PersonalTask["status"]) => {
    updateMutation.mutate({ status: status as (typeof STATUS_OPTIONS)[number] });
  };

  const confirmDelete = () => {
    Alert.alert("Delete task", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  if (!id) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500 text-sm">Missing task id.</Text>
      </SafeAreaView>
    );
  }

  if (isLoading || !task) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#047857" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">Task</Text>
        <TouchableOpacity onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#047857"
          />
        }
      >
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
          <Text className="text-xs text-gray-400 mb-2">
            {task.priority} · {task.status.replace("_", " ")}
          </Text>
          <TextInput
            className="text-base font-semibold text-gray-900 border border-gray-100 rounded-xl px-3 py-2 mb-2"
            value={displayTitle}
            onChangeText={(t) => setTitle(t)}
          />
          <TextInput
            className="text-sm text-gray-700 border border-gray-100 rounded-xl px-3 py-2 min-h-[72px]"
            placeholder="Description"
            placeholderTextColor="#9ca3af"
            multiline
            textAlignVertical="top"
            value={displayDescription}
            onChangeText={(d) => setDescription(d)}
          />
          {(title !== null || description !== null) && (
            <TouchableOpacity
              onPress={saveFields}
              disabled={updateMutation.isPending}
              className="mt-3 bg-emerald-700 rounded-xl h-10 items-center justify-center"
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-sm font-medium">Save</Text>
              )}
            </TouchableOpacity>
          )}
          {task.dueDate && (
            <Text className="text-xs text-gray-500 mt-3">
              Due {formatDate(task.dueDate)}
            </Text>
          )}
        </View>

        <Text className="text-sm font-semibold text-gray-900 mb-2">Status</Text>
        <View className="flex-row flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => {
            const active = task.status === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                disabled={updateMutation.isPending}
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
                  {s.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
