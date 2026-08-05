import { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminUsersApi,
  departmentsApi,
  getApiErrorMessage,
  staffApi,
  type AdminUser,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canDeactivateUsers, canManageSettingsUsers } from "@/lib/settings-access";
import { getRolesAssignableBy } from "@/lib/staff-roles";
import { formatRoleLabel } from "@/lib/utils";

const EMPLOYMENT_STATUSES = [
  "ACTIVE",
  "ON_LEAVE",
  "SUSPENDED",
  "TERMINATED",
  "RESIGNED",
] as const;

function EditUserSheet({
  user,
  departments,
  assignableRoles,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  departments: { id: string; name: string; code: string }[];
  assignableRoles: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [secondaryPhone, setSecondaryPhone] = useState(user.secondaryPhone ?? "");
  const [employeeId, setEmployeeId] = useState(user.employeeId ?? "");
  const [role, setRole] = useState(user.role);
  const [departmentId, setDepartmentId] = useState(user.departmentId ?? "");
  const [employmentStatus, setEmploymentStatus] = useState(user.employmentStatus);

  const saveMutation = useMutation({
    mutationFn: () =>
      staffApi.update(user.id, {
        name: name.trim(),
        phone,
        secondaryPhone,
        employeeId,
        role,
        departmentId: departmentId || undefined,
        employmentStatus,
      }),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert("Error", e?.response?.data?.error ?? "Update failed");
    },
  });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-5 py-4 border-b border-gray-100 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-900">Edit user</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
          <Text className="text-xs text-gray-500 mb-4">{user.email}</Text>

          <Text className="text-xs font-medium text-gray-700 mb-1">Display name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm mb-3"
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-700 mb-1">Phone</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm mb-3"
              />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-medium text-gray-700 mb-1">Alt. phone</Text>
              <TextInput
                value={secondaryPhone}
                onChangeText={setSecondaryPhone}
                className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm mb-3"
              />
            </View>
          </View>

          <Text className="text-xs font-medium text-gray-700 mb-1">Employee ID</Text>
          <TextInput
            value={employeeId}
            onChangeText={setEmployeeId}
            className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm mb-3"
          />

          <Text className="text-sm font-semibold text-gray-900 mb-2">Portal role</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {assignableRoles.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRole(r)}
                className={`rounded-full px-3 py-1.5 border ${
                  role === r
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    role === r ? "text-emerald-700" : "text-gray-600"
                  }`}
                >
                  {formatRoleLabel(r)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-semibold text-gray-900 mb-2">Department</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {departments.map((d) => (
              <TouchableOpacity
                key={d.id}
                onPress={() => setDepartmentId(d.id)}
                className={`rounded-full px-3 py-1.5 border ${
                  departmentId === d.id
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    departmentId === d.id ? "text-emerald-700" : "text-gray-600"
                  }`}
                >
                  {d.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-semibold text-gray-900 mb-2">Employment status</Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {EMPLOYMENT_STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setEmploymentStatus(s)}
                className={`rounded-full px-3 py-1.5 border ${
                  employmentStatus === s
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    employmentStatus === s ? "text-emerald-700" : "text-gray-600"
                  }`}
                >
                  {s.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-emerald-700 rounded-xl h-12 items-center justify-center mb-8"
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Save changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export default function SettingsUsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");

  const allowed = canManageSettingsUsers(user?.role);
  const canRemove = canDeactivateUsers(user?.role);
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

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
    enabled: !authLoading && allowed,
  });

  const createDeptMutation = useMutation({
    mutationFn: () =>
      departmentsApi.create({
        name: deptName.trim(),
        code: deptCode.trim(),
      }),
    onSuccess: async () => {
      setDeptName("");
      setDeptCode("");
      setDeptOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
      Alert.alert("Saved", "Department created.");
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert("Error", e?.response?.data?.error ?? "Could not create department");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => staffApi.deactivate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert("Error", e?.response?.data?.error ?? "Remove failed");
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q) ?? false) ||
        (u.employeeId?.toLowerCase().includes(q) ?? false)
    );
  }, [users, search]);

  if (!allowed) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-gray-600 text-sm text-center">
          You do not have access to user management.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-emerald-700 font-medium">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const confirmRemove = (target: AdminUser) => {
    Alert.alert(
      "Remove user",
      "They will be terminated and unable to sign in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => deactivateMutation.mutate(target.id),
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center gap-3 mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">User management</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Edit details, departments, and access
            </Text>
          </View>
        </View>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 h-10">
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-900 text-sm"
            placeholder="Search users…"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          onPress={() => setDeptOpen(!deptOpen)}
          className="mt-3 flex-row items-center gap-2 self-start"
        >
          <Ionicons name="business-outline" size={16} color="#047857" />
          <Text className="text-sm font-medium text-emerald-700">
            {deptOpen ? "Cancel add department" : "Add department"}
          </Text>
        </TouchableOpacity>
        {deptOpen && (
          <View className="mt-3 gap-2">
            <TextInput
              placeholder="Department name"
              value={deptName}
              onChangeText={setDeptName}
              className="bg-white border border-gray-200 rounded-xl px-3 h-10 text-sm"
            />
            <TextInput
              placeholder="Code (e.g. FIN)"
              value={deptCode}
              onChangeText={setDeptCode}
              autoCapitalize="characters"
              className="bg-white border border-gray-200 rounded-xl px-3 h-10 text-sm"
            />
            <TouchableOpacity
              onPress={() => createDeptMutation.mutate()}
              disabled={
                createDeptMutation.isPending ||
                !deptName.trim() ||
                !deptCode.trim()
              }
              className="bg-emerald-700 rounded-xl h-10 items-center justify-center"
            >
              {createDeptMutation.isPending ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white text-sm font-semibold">Save department</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#047857"
              />
            }
          >
            <Text className="text-xs text-gray-400 mb-3">
              {filtered.length} user{filtered.length !== 1 ? "s" : ""}
            </Text>
            {filtered.map((u) => (
            <View
              key={u.id}
              className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
            >
              <Text className="font-semibold text-gray-900">{u.name ?? "—"}</Text>
              <Text className="text-xs text-gray-500 mt-0.5">{u.email}</Text>
              <View className="flex-row flex-wrap gap-2 mt-2">
                <Text className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-700">
                  {formatRoleLabel(u.role)}
                </Text>
                <Text className="text-xs bg-gray-100 rounded-full px-2 py-0.5 text-gray-700">
                  {u.employmentStatus}
                </Text>
                {u.department && (
                  <Text className="text-xs text-gray-500">{u.department.name}</Text>
                )}
              </View>
              <View className="flex-row gap-4 mt-3">
                <TouchableOpacity onPress={() => setEditUser(u)}>
                  <Text className="text-sm font-medium text-emerald-700">Edit</Text>
                </TouchableOpacity>
                {canRemove &&
                  u.id !== user?.id &&
                  u.employmentStatus === "ACTIVE" && (
                    <TouchableOpacity onPress={() => confirmRemove(u)}>
                      <Text className="text-sm font-medium text-red-600">Remove</Text>
                    </TouchableOpacity>
                  )}
              </View>
            </View>
          ))}
          {filtered.length === 0 && (
            <Text className="text-center text-gray-400 text-sm py-12">
              No users match your search
            </Text>
          )}
          </ScrollView>
        )}
      </View>

      {editUser && (
        <EditUserSheet
          user={editUser}
          departments={departments.map((d) => ({
            id: d.id,
            name: d.name,
            code: d.code,
          }))}
          assignableRoles={assignableRoles}
          onClose={() => setEditUser(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["staff"] });
          }}
        />
      )}
    </SafeAreaView>
  );
}
