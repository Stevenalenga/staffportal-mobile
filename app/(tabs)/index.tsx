import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi } from "@/lib/api";

type StatCardProps = {
  label: string;
  value: number;
  sub: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bg: string;
};

function StatCard({ label, value, sub, iconName, color, bg }: StatCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 flex-1 mx-1 border border-gray-100 shadow-sm">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: bg }}
      >
        <Ionicons name={iconName} size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs font-medium text-gray-600 mt-0.5">{label}</Text>
      <Text className="text-xs text-gray-400 mt-0.5">{sub}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.stats,
  });

  const statCards: StatCardProps[] = stats
    ? [
        {
          label: "Total Staff",
          value: stats.totalStaff,
          sub: `${stats.activeStaff} active`,
          iconName: "people",
          color: "#2563eb",
          bg: "#eff6ff",
        },
        {
          label: "Assets",
          value: stats.totalAssets,
          sub: `${stats.assignedAssets} assigned`,
          iconName: "cube",
          color: "#7c3aed",
          bg: "#f5f3ff",
        },
        {
          label: "Pending Expenses",
          value: stats.pendingExpenses,
          sub: "awaiting approval",
          iconName: "receipt",
          color: "#ea580c",
          bg: "#fff7ed",
        },
        {
          label: "Active Projects",
          value: stats.activeProjects,
          sub: "in progress",
          iconName: "folder",
          color: "#047857",
          bg: "#ecfdf5",
        },
        {
          label: "Open Tasks",
          value: stats.openTasks,
          sub: "pending",
          iconName: "checkbox",
          color: "#0d9488",
          bg: "#f0fdfa",
        },
        {
          label: "Leave Requests",
          value: stats.pendingLeave,
          sub: "pending decision",
          iconName: "calendar",
          color: "#ca8a04",
          bg: "#fefce8",
        },
      ]
    : [];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      {/* Header */}
      <View className="bg-emerald-700 px-5 pt-2 pb-6">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-emerald-100 text-sm">Good morning,</Text>
            <Text className="text-white text-xl font-bold">{firstName}</Text>
          </View>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="notifications-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 -mt-3"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#047857"
          />
        }
      >
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
          <Text className="text-sm font-semibold text-gray-700 mb-1">
            Overview
          </Text>
          <Text className="text-xs text-gray-400">
            Real-time operational metrics
          </Text>
        </View>

        {isLoading ? (
          <View className="flex-row flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <View
                key={i}
                className="bg-gray-100 rounded-2xl h-28 flex-1 mx-1 min-w-[140px]"
              />
            ))}
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-y-3">
            {statCards.map((card, i) => (
              <View key={i} className="w-1/2 px-1">
                <StatCard {...card} />
              </View>
            ))}
          </View>
        )}

        {/* Quick actions */}
        <View className="mt-4">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-y-2">
            {(
              [
                {
                  label: "New Expense",
                  icon: "receipt-outline" as const,
                  color: "#ea580c",
                  bg: "#fff7ed",
                  href: "/expenses/new",
                },
                {
                  label: "View Tasks",
                  icon: "checkbox-outline" as const,
                  color: "#047857",
                  bg: "#ecfdf5",
                  href: "/(tabs)/tasks",
                },
                {
                  label: "Staff List",
                  icon: "people-outline" as const,
                  color: "#2563eb",
                  bg: "#eff6ff",
                  href: "/(tabs)/staff",
                },
                {
                  label: "Projects",
                  icon: "folder-outline" as const,
                  color: "#7c3aed",
                  bg: "#f5f3ff",
                  href: "/projects",
                },
              ] as const
            ).map((action) => (
              <TouchableOpacity
                key={action.label}
                className="w-1/2 px-1"
                onPress={() => router.push(action.href as Href)}
              >
                <View
                  className="rounded-xl p-3 flex-row items-center gap-3 border border-gray-100"
                  style={{ backgroundColor: action.bg }}
                >
                  <Ionicons name={action.icon} size={20} color={action.color} />
                  <Text
                    className="text-sm font-medium"
                    style={{ color: action.color }}
                  >
                    {action.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
