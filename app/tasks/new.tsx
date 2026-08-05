import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { tasksApi } from "@/lib/api";

const schema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(5000).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.dueDate) {
      if (new Date(data.startDate) > new Date(data.dueDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date must be on or before the deadline",
          path: ["dueDate"],
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

const PRIORITIES: FormData["priority"][] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

export default function NewTaskScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      startDate: "",
      dueDate: "",
    },
  });

  const priority = watch("priority");

  const createMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.back();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert(
        "Error",
        e?.response?.data?.error ?? "Could not create task."
      );
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      priority: data.priority,
      startDate: data.startDate?.trim() || undefined,
      dueDate: data.dueDate?.trim() || undefined,
    });
  };

  const busy = createMutation.isPending;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={18} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">New Task</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1.5">
              Title *
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900"
                  placeholder="What needs to be done?"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.title && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1.5">
              Description
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 min-h-[80px]"
                  placeholder="Optional details"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>

          <Text className="text-xs font-medium text-gray-500 mb-1.5">
            Priority
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {PRIORITIES.map((p) => {
              const active = priority === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => setValue("priority", p)}
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
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-row gap-3 mb-6">
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-500 mb-1.5">
                Start date
              </Text>
              <Controller
                control={control}
                name="startDate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-500 mb-1.5">
                Due date
              </Text>
              <Controller
                control={control}
                name="dueDate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900"
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.dueDate && (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.dueDate.message}
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={busy}
            className={`bg-emerald-700 rounded-xl h-12 items-center justify-center ${
              busy ? "opacity-70" : ""
            }`}
          >
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Create Task
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
