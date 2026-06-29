import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { formatRoleLabel, getInitials, getRoleColor } from "@/lib/utils";

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
};

function MenuItem({ icon, label, sub, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center px-4 py-3.5 bg-white border-b border-gray-50"
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center mr-3 ${
          danger ? "bg-red-50" : "bg-gray-100"
        }`}
      >
        <Ionicons
          name={icon}
          size={18}
          color={danger ? "#dc2626" : "#4b5563"}
        />
      </View>
      <View className="flex-1">
        <Text
          className={`text-sm font-medium ${
            danger ? "text-red-600" : "text-gray-800"
          }`}
        >
          {label}
        </Text>
        {sub && <Text className="text-xs text-gray-400 mt-0.5">{sub}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const initials = getInitials(user?.name ?? user?.email ?? "?");
  const roleColor = getRoleColor(user?.role ?? "STAFF");

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-900">More</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Profile card */}
        <View className="bg-emerald-700 mx-4 mt-4 rounded-2xl p-5 flex-row items-center gap-4">
          <View
            className="w-14 h-14 rounded-full items-center justify-center"
            style={{ backgroundColor: `${roleColor}30` }}
          >
            <Text
              className="font-bold text-xl"
              style={{ color: "white" }}
            >
              {initials}
            </Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-white font-bold text-base" numberOfLines={1}>
              {user?.name ?? "User"}
            </Text>
            <Text className="text-emerald-200 text-xs mt-0.5" numberOfLines={1}>
              {user?.email}
            </Text>
            <View className="mt-1.5 bg-white/20 self-start rounded-full px-2 py-0.5">
              <Text className="text-white text-xs font-medium">
                {formatRoleLabel(user?.role ?? "STAFF")}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu sections */}
        <View className="mx-4 mt-4 rounded-2xl overflow-hidden border border-gray-100">
          <MenuItem
            icon="person-outline"
            label="My Profile"
            sub="View and edit your profile"
            onPress={() => {}}
          />
          <MenuItem
            icon="folder-outline"
            label="Projects"
            sub="Browse active projects"
            onPress={() => {}}
          />
          <MenuItem
            icon="cube-outline"
            label="Assets"
            sub="Register, assignments & maintenance"
            onPress={() => router.push("/assets")}
          />
          <MenuItem
            icon="calendar-outline"
            label="Leave Requests"
            sub="Apply for or review leave"
            onPress={() => {}}
          />
          <MenuItem
            icon="bar-chart-outline"
            label="Reports"
            sub="Download operational reports"
            onPress={() => {}}
          />
        </View>

        <View className="mx-4 mt-3 rounded-2xl overflow-hidden border border-gray-100">
          <MenuItem
            icon="settings-outline"
            label="Settings"
            sub="App preferences"
            onPress={() => {}}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            sub="Contact IT Administrator"
            onPress={() => Linking.openURL("mailto:info@uthabitiafrica.org")}
          />
          <MenuItem
            icon="information-circle-outline"
            label="About"
            sub="Uthabiti Africa Portal v1.0"
            onPress={() => {}}
          />
        </View>

        <View className="mx-4 mt-3 mb-6 rounded-2xl overflow-hidden border border-gray-100">
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
