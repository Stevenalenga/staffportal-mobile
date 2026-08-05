import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { profileApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { updateProfileSchema } from "@/lib/profile-validation";
import { formatRoleLabel } from "@/lib/utils";

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, updateStoredUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: profileApi.get,
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setPhone(profile.phone ?? "");
    setSecondaryPhone(profile.secondaryPhone ?? "");
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const parsed = updateProfileSchema.safeParse({
        name,
        phone,
        secondaryPhone,
      });
      if (!parsed.success) {
        const msg =
          parsed.error.issues[0]?.message ?? "Please check your details.";
        setFieldError(msg);
        return Promise.reject(new Error(msg));
      }
      setFieldError(null);
      return profileApi.update(parsed.data);
    },
    onSuccess: async (updated) => {
      await updateStoredUser({
        ...user!,
        name: updated.name,
        phone: updated.phone,
        secondaryPhone: updated.secondaryPhone,
        email: updated.email,
        role: updated.role,
        image: updated.image,
        employeeId: updated.employeeId,
        department: updated.department,
        position: updated.position,
      });
      Alert.alert("Saved", "Your profile was updated.");
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message && !fieldError) {
        Alert.alert("Error", err.message);
        return;
      }
      const e = err as { response?: { data?: { error?: string } } };
      Alert.alert("Error", e?.response?.data?.error ?? "Could not save changes.");
    },
  });

  const email = profile?.email ?? user?.email ?? "";

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
          <Text className="text-xl font-bold text-gray-900">My profile</Text>
          <Text className="text-xs text-gray-500 mt-0.5">
            Display name and phone numbers
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
            <Text className="text-xs text-gray-500">Portal role</Text>
            <Text className="text-sm font-medium text-gray-900 mt-1">
              {formatRoleLabel(profile?.role ?? user?.role ?? "STAFF")}
            </Text>
            {profile?.department && (
              <>
                <Text className="text-xs text-gray-500 mt-3">Department</Text>
                <Text className="text-sm text-gray-800 mt-1">
                  {profile.department.name}
                </Text>
              </>
            )}
          </View>

          <Text className="text-xs font-medium text-gray-700 mb-1">
            Display name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm mb-1"
          />
          <Text className="text-xs text-gray-500 mb-3">
            Shown in the portal header and on your profile.
          </Text>
          {fieldError && (
            <Text className="text-xs text-red-600 mb-2">{fieldError}</Text>
          )}

          <Text className="text-xs font-medium text-gray-700 mb-1">Work email</Text>
          <View className="bg-gray-100 border border-gray-200 rounded-xl px-3 h-11 justify-center mb-1">
            <Text className="text-sm text-gray-600">{email}</Text>
          </View>
          <Text className="text-xs text-gray-500 mb-3">
            Your sign-in email is fixed. Contact IT if you need it changed.
          </Text>

          <Text className="text-xs font-medium text-gray-700 mb-1">Primary phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+254 7XX XXX XXX"
            keyboardType="phone-pad"
            className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm mb-3"
          />

          <Text className="text-xs font-medium text-gray-700 mb-1">
            Secondary phone
          </Text>
          <TextInput
            value={secondaryPhone}
            onChangeText={setSecondaryPhone}
            placeholder="Optional"
            keyboardType="phone-pad"
            className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm mb-6"
          />

          <TouchableOpacity
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="bg-emerald-700 rounded-xl h-12 items-center justify-center mb-4"
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Save changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL("mailto:info@uthabitiafrica.org")}
            className="flex-row items-center justify-center gap-2 py-3 mb-8"
          >
            <Ionicons name="mail-outline" size={18} color="#047857" />
            <Text className="text-sm font-medium text-emerald-700">
              Contact IT support
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
