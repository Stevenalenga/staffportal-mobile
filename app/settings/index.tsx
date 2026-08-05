import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  canAccessSettingsAdminHub,
  canManageExpenseWorkflowRoles,
  canManageSettingsUsers,
} from "@/lib/settings-access";

type SectionProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
  color: string;
  onPress: () => void;
};

function SectionCard({ icon, title, description, color, onPress }: SectionProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 border border-gray-100 mb-3"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <Ionicons name={icon} size={20} color="#374151" />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-900">{title}</Text>
          <Text className="text-xs text-gray-500 mt-1">{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role;
  const adminHub = canAccessSettingsAdminHub(role);
  const manageUsers = canManageSettingsUsers(role);
  const manageWorkflow = canManageExpenseWorkflowRoles(role);

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
          <Text className="text-xl font-bold text-gray-900">Settings</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {adminHub
              ? "Your account and portal administration"
              : "Personal preferences and support"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <Text className="text-xs font-semibold text-gray-400 uppercase mb-2 px-1">
          My account
        </Text>
        <SectionCard
          icon="person-circle-outline"
          title="My profile"
          description="Display name, phone numbers, and IT support"
          color="#ecfdf5"
          onPress={() => router.push("/settings/account" as Href)}
        />

        {adminHub && (
          <>
            <Text className="text-xs font-semibold text-gray-400 uppercase mb-2 mt-4 px-1">
              Administration
            </Text>
            {manageUsers && (
              <SectionCard
                icon="people-outline"
                title="User management"
                description="Create users, edit details, departments, and remove access"
                color="#eff6ff"
                onPress={() => router.push("/settings/users" as Href)}
              />
            )}
            {manageWorkflow && (
              <SectionCard
                icon="shield-checkmark-outline"
                title="Expense workflow roles"
                description="Finance, CEO, and Operations roles for expense approvals"
                color="#f5f3ff"
                onPress={() => router.push("/settings/workflow-roles" as Href)}
              />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
