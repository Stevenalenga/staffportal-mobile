import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUsersApi, getApiErrorMessage, staffApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  canManageExpenseWorkflowRoles,
  EXPENSE_WORKFLOW_ROLES,
} from "@/lib/settings-access";
import { getRolesAssignableBy } from "@/lib/staff-roles";
import { formatRoleLabel } from "@/lib/utils";

export default function SettingsWorkflowRolesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const allowed = canManageExpenseWorkflowRoles(user?.role);
  const assignableRoles = getRolesAssignableBy(user?.role);

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminUsersApi.list,
    enabled: !authLoading && allowed,
  });

  const workflowUsers = users.filter((u) => u.employmentStatus === "ACTIVE");

  const setRole = async (userId: string, role: string) => {
    setLoadingId(userId);
    try {
      await staffApi.update(userId, { role });
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["staff"] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert("Error", e?.response?.data?.error ?? "Could not update role");
    } finally {
      setLoadingId(null);
    }
  };

  if (!allowed) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-gray-600 text-sm text-center">
          Only IT Admin and CEO can manage expense workflow roles.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-emerald-700 font-medium">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const byRole = EXPENSE_WORKFLOW_ROLES.map((role) => ({
    role,
    members: workflowUsers.filter((u) => u.role === role),
  }));

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
          <Text className="text-xl font-bold text-gray-900">Expense workflow roles</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Finance, CEO, and Operations in the approval chain
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }}>
      {isLoading || authLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="cloud-offline-outline" size={40} color="#9ca3af" />
          <Text className="text-gray-600 text-sm text-center mt-3">
            {getApiErrorMessage(error, "Could not load users.")}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 bg-emerald-700 rounded-xl px-4 py-2"
          >
            <Text className="text-white font-medium text-sm">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#047857" />
          }
        >
          <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
            <Text className="text-sm font-semibold text-blue-950">
              Expense & refund approval flow
            </Text>
            <Text className="text-xs text-blue-900/80 mt-2">
              Assign Finance for first-line review, CEO for final approval, and Operations
              for oversight. IT Admin can perform all steps.
            </Text>
          </View>

          {byRole.map(({ role, members }) => (
            <View
              key={role}
              className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
            >
              <Text className="text-sm font-semibold text-gray-900">
                {formatRoleLabel(role)}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                {members.length} active user{members.length === 1 ? "" : "s"}
              </Text>
              {members.length === 0 ? (
                <Text className="text-xs text-gray-400 italic mt-2">None assigned</Text>
              ) : (
                members.map((m) => (
                  <Text key={m.id} className="text-sm text-gray-700 mt-2">
                    {m.name ?? m.email}
                  </Text>
                ))
              )}
            </View>
          ))}

          <Text className="text-sm font-semibold text-gray-900 mt-2 mb-2">
            Assign workflow roles
          </Text>
          {workflowUsers.map((u) => (
            <View
              key={u.id}
              className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
            >
              <Text className="font-medium text-gray-900">{u.name ?? "—"}</Text>
              <Text className="text-xs text-gray-500">{u.email}</Text>
              <Text className="text-xs text-gray-500 mt-1">
                Current: {formatRoleLabel(u.role)}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-3"
                contentContainerStyle={{ gap: 8 }}
              >
                {assignableRoles.map((r) => {
                  const active = u.role === r;
                  const busy = loadingId === u.id;
                  return (
                    <TouchableOpacity
                      key={r}
                      disabled={busy}
                      onPress={() => setRole(u.id, r)}
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
              </ScrollView>
              {loadingId === u.id && (
                <View className="mt-2">
                  <ActivityIndicator size="small" color="#047857" />
                </View>
              )}
            </View>
          ))}
          {workflowUsers.length === 0 && (
            <Text className="text-center text-gray-400 text-sm py-8">
              No active users in the directory.
            </Text>
          )}
        </ScrollView>
      )}
      </View>
    </SafeAreaView>
  );
}
