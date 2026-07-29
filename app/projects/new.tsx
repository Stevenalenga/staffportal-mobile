import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";

const createProjectSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z
    .string()
    .min(1, "Code is required")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Code may only contain letters, numbers, _ and -"
    ),
  description: z.string().optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  funder: z.string().optional(),
  objectives: z.string().optional(),
});

type FormData = z.infer<typeof createProjectSchema>;

const STATUS_OPTIONS: { value: FormData["status"]; label: string }[] = [
  { value: "PLANNING", label: "Planning" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-gray-700 text-sm font-medium mb-1.5">{children}</Text>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text className="text-red-500 text-xs mt-1">{message}</Text>;
}

export default function NewProjectScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      status: "PLANNING",
      startDate: "",
      endDate: "",
      funder: "",
      objectives: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.replace(`/projects/${project.id}` as Href);
    },
    onError: (err: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      const message =
        e?.response?.data?.error ?? e?.message ?? "Could not create project.";
      Alert.alert("Create Failed", message);
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      description: data.description?.trim() || undefined,
      status: data.status,
      startDate: data.startDate?.trim() || undefined,
      endDate: data.endDate?.trim() || undefined,
      funder: data.funder?.trim() || undefined,
      objectives: data.objectives?.trim() || undefined,
    });
  };

  const busy = isSubmitting || createMutation.isPending;

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
          <Text className="text-xl font-bold text-gray-900">New Project</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Create a project and invite members
          </Text>
        </View>
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
          <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
            <View className="mb-4">
              <FieldLabel>Name *</FieldLabel>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900 bg-gray-50"
                    placeholder="Project name"
                    placeholderTextColor="#9ca3af"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <FieldError message={errors.name?.message} />
            </View>

            <View className="mb-4">
              <FieldLabel>Code *</FieldLabel>
              <Controller
                control={control}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900 bg-gray-50 font-mono"
                    placeholder="e.g. UTH-2026"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="characters"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <FieldError message={errors.code?.message} />
            </View>

            <View className="mb-4">
              <FieldLabel>Description</FieldLabel>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 bg-gray-50 min-h-[80px]"
                    placeholder="Brief project description"
                    placeholderTextColor="#9ca3af"
                    multiline
                    textAlignVertical="top"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>

            <View className="mb-1">
              <FieldLabel>Status *</FieldLabel>
              <Controller
                control={control}
                name="status"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const active = value === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => onChange(opt.value)}
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
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              />
              <FieldError message={errors.status?.message} />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <FieldLabel>Start date</FieldLabel>
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900 bg-gray-50"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <FieldLabel>End date</FieldLabel>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900 bg-gray-50"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>
            </View>

            <View className="mb-4">
              <FieldLabel>Funder</FieldLabel>
              <Controller
                control={control}
                name="funder"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900 bg-gray-50"
                    placeholder="Funding partner"
                    placeholderTextColor="#9ca3af"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>

            <View>
              <FieldLabel>Objectives</FieldLabel>
              <Controller
                control={control}
                name="objectives"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 bg-gray-50 min-h-[90px]"
                    placeholder="Key objectives"
                    placeholderTextColor="#9ca3af"
                    multiline
                    textAlignVertical="top"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={busy}
            className={`bg-emerald-700 rounded-xl h-12 items-center justify-center flex-row gap-2 ${
              busy ? "opacity-70" : ""
            }`}
          >
            {busy ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="white" />
                <Text className="text-white font-semibold text-base">
                  Create Project
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
