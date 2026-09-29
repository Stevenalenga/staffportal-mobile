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
  Image,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email.trim().toLowerCase(), data.password);
      router.replace("/(tabs)");
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      let message: string;

      if (e?.response) {
        // Server replied with an error status
        const serverMsg: string | undefined = e.response?.data?.error;
        const status: number | undefined = e.response?.status;
        if (serverMsg) {
          message = serverMsg;
        } else if (status === 401) {
          message = "Invalid email or password.";
        } else if (status === 403) {
          message = "Your account is inactive. Contact your IT Administrator.";
        } else if (status === 500) {
          message =
            "Portal server error — the database may be offline. Contact IT to check DATABASE_URL on the server.";
        } else if (status === 503) {
          message =
            "Portal database is unreachable. The web app must be redeployed with a valid DATABASE_URL.";
        } else {
          message = `Unexpected error (HTTP ${status}).`;
        }
      } else if (e?.request) {
        // Request was sent but no response received (network / firewall)
        message =
          `Cannot reach the server.\n\n` +
          `URL: ${process.env.EXPO_PUBLIC_API_URL ?? "not set"}\n\n` +
          `Make sure:\n` +
          `• Your phone is on the same Wi-Fi as this PC\n` +
          `• The Next.js portal is running (npm run dev)\n` +
          `• Windows Firewall allows port 3000 inbound`;
      } else {
        message = e?.message ?? "Something went wrong. Please try again.";
      }

      Alert.alert("Sign In Failed", message, [{ text: "OK" }]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "left", "right"]}>
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="bg-emerald-700 px-6 pt-6 pb-10 items-center">
          <View className="bg-white rounded-2xl px-5 py-3 mb-4 shadow-sm">
            <Image
              source={require("../../assets/logo.webp")}
              style={{ width: 140, height: 42 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-emerald-100 text-sm mt-1">Staff Portal</Text>
        </View>

        {/* Form */}
        <View className="flex-1 px-6 pt-8">
          <Text className="text-gray-900 text-xl font-semibold mb-1">
            Welcome back
          </Text>
          <Text className="text-gray-500 text-sm mb-8">
            Sign in to your account to continue
          </Text>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              Email address
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row items-center border border-gray-300 rounded-xl px-3 bg-gray-50">
                  <Ionicons name="mail-outline" size={18} color="#9ca3af" />
                  <TextInput
                    className="flex-1 h-12 ml-2 text-gray-900 text-sm"
                    placeholder="you@uthabitiafrica.org"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </Text>
            )}
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              Password
            </Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex-row items-center border border-gray-300 rounded-xl px-3 bg-gray-50">
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#9ca3af"
                  />
                  <TextInput
                    className="flex-1 h-12 ml-2 text-gray-900 text-sm"
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#9ca3af"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            className={`bg-emerald-700 rounded-xl h-12 items-center justify-center mb-4 ${
              isSubmitting ? "opacity-70" : ""
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/(auth)/register" as Href)}
            className="mt-4 items-center"
          >
            <Text className="text-sm text-gray-600">
              New to the portal?{" "}
              <Text className="text-emerald-700 font-medium">
                Create an account
              </Text>
            </Text>
          </TouchableOpacity>

          <Text className="text-center text-gray-400 text-xs mt-3">
            Need help? Contact the IT Administrator
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
