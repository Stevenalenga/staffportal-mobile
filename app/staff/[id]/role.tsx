import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi, staffApi } from "@/lib/api";
import { getRolesAssignableBy } from "@/lib/staff-roles";
import { formatRoleLabel } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { isItAdmin } from "@/lib/staff-roles";

const EMPLOYMENT_STATUSES = [
  "ACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
  "RESIGNED",
] as const;

export default function StaffRoleScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [role, setRole] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [employmentStatus, setEmploymentStatus] = useState<string | null>(null);

  const { data: staffMember, isLoading } = useQuery({
    queryKey: ["staff-role", id],
    queryFn: () => staffApi.get(id!),
    enabled: !!id && isItAdmin(user?.role),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
    enabled: isItAdmin(user?.role),
  });

  const assignableRoles = getRolesAssignableBy(user?.role);

  const selectedRole = role ?? staffMember?.role ?? "";
  const selectedDept =
    departmentId ?? staffMember?.departmentId ?? staffMember?.department?.id ?? "";
  const selectedStatus =
    employmentStatus ?? staffMember?.employmentStatus ?? "ACTIVE";

  const saveMutation = useMutation({
    mutationFn: () =>
      staffApi.updateRole(id!, {
        role: selectedRole,
        departmentId: selectedDept || undefined,
        employmentStatus: selectedStatus,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
      Alert.alert("Saved", "Portal role updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert("Error", e?.response?.data?.error ?? "Could not update role.");
    },
  });

  if (!isItAdmin(user?.role)) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-gray-600 text-sm text-center">
          Only IT Admin can change portal roles.
        </Text>
      </SafeAreaView>
    );
  }

  if (!id || isLoading || !staffMember) {
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
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900">Assign portal role</Text>
          <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
            {staffMember.name ?? staffMember.email}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
          <Text className="text-xs text-gray-500 mb-1">Staff member</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {staffMember.name ?? "—"}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">{staffMember.email}</Text>
        </View>

        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Portal role
        </Text>
        <Text className="text-xs text-gray-500 mb-2">
          CEO, Operations, Finance, and IT Admin can only be assigned by IT Admin.
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {assignableRoles.map((r) => {
            const active = selectedRole === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
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
                  {formatRoleLabel(r)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Department
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {departments.map((d) => {
            const active = selectedDept === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => setDepartmentId(d.id)}
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
                  {d.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Employment status
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {EMPLOYMENT_STATUSES.map((s) => {
            const active = selectedStatus === s;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setEmploymentStatus(s)}
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

        <TouchableOpacity
          onPress={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !selectedRole || !selectedDept}
          className={`bg-emerald-700 rounded-xl h-12 items-center justify-center ${
            saveMutation.isPending ? "opacity-70" : ""
          }`}
        >
          {saveMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">Save changes</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
