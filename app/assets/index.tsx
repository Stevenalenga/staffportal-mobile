import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ApiErrorPanel } from "@/components/ApiErrorPanel";
import { assetsApi, dashboardApi, getApiErrorMessage } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canManageAssets } from "@/lib/portal-access";

type HubCardProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  color: string;
  bg: string;
  onPress: () => void;
};

function HubCard({ icon, title, subtitle, color, bg, onPress }: HubCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 flex-row items-center gap-4"
    >
      <View
        className="w-12 h-12 rounded-xl items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-900 text-base">{title}</Text>
        <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}

export default function AssetsHubScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const manager = canManageAssets(user?.role);

  const {
    data: stats,
    isError: statsError,
    error: statsErr,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.stats,
  });

  const {
    data: myAssets = [],
    isError: assetsError,
    error: assetsErr,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ["assets"],
    queryFn: assetsApi.list,
    enabled: !manager,
  });

  const loadError = manager ? statsError : assetsError || statsError;
  const loadErrorObj = manager ? statsErr : assetsErr ?? statsErr;

  const assetTotal = manager ? stats?.totalAssets : myAssets.length;
  const assetAssigned = manager
    ? stats?.assignedAssets
    : myAssets.filter((a) => a.status === "ASSIGNED").length;

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
          <Text className="text-xl font-bold text-gray-900">Assets</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            {manager
              ? "Manage register, assignments & maintenance"
              : "Assets assigned to you"}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {loadError ? (
          <ApiErrorPanel
            message={getApiErrorMessage(
              loadErrorObj,
              "Could not load asset information from the portal."
            )}
            onRetry={() => {
              refetchStats();
              if (!manager) refetchAssets();
            }}
          />
        ) : null}

        {(assetTotal !== undefined || assetAssigned !== undefined) && (
          <View className="bg-emerald-700 rounded-2xl p-5 mb-4 flex-row justify-between">
            <View>
              <Text className="text-emerald-200 text-xs">
                {manager ? "Total Assets" : "My assets"}
              </Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {assetTotal ?? 0}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-emerald-200 text-xs">Assigned</Text>
              <Text className="text-white text-3xl font-bold mt-1">
                {assetAssigned ?? 0}
              </Text>
            </View>
          </View>
        )}

        <HubCard
          icon="cube-outline"
          title={manager ? "Asset Register" : "My assigned assets"}
          subtitle={
            manager
              ? "View all company assets"
              : "Equipment and items assigned to you"
          }
          color="#047857"
          bg="#ecfdf5"
          onPress={() => router.push("/assets/register")}
        />

        {manager && (
          <>
            <HubCard
              icon="swap-horizontal-outline"
              title="Assignments"
              subtitle="Assign, transfer or return assets"
              color="#2563eb"
              bg="#eff6ff"
              onPress={() => router.push("/assets/assignments")}
            />
            <HubCard
              icon="construct-outline"
              title="Maintenance"
              subtitle="Report damaged assets & track repairs"
              color="#dc2626"
              bg="#fef2f2"
              onPress={() => router.push("/assets/maintenance")}
            />
          </>
        )}

        {!manager && (
          <HubCard
            icon="construct-outline"
            title="Report an issue"
            subtitle="Log maintenance for your assigned asset"
            color="#dc2626"
            bg="#fef2f2"
            onPress={() => router.push("/assets/maintenance")}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
