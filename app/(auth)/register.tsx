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
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { authApi } from "@/lib/api";
import {
  createRegisterSchema,
  fallbackRegisterDomains,
  type RegisterInput,
} from "@/lib/auth-validation";

export default function RegisterScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: domains = fallbackRegisterDomains } = useQuery({
    queryKey: ["register-domains"],
    queryFn: authApi.registerDomains,
    staleTime: 300_000,
  });

  const schema = useMemo(() => createRegisterSchema(domains), [domains]);
  const domainsHint = domains.map((d) => `@${d}`).join(", ");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(schema) as Resolver<RegisterInput>,
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      const result = await authApi.register({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      Alert.alert(
        "Account created",
        result.message ?? "You can now sign in.",
        [
          {
            text: "Sign in",
            onPress: () => router.replace("/(auth)/login" as Href),
          },
        ]
      );
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      const msg =
        e?.response?.data?.error ?? "Registration failed. Please try again.";
      setServerError(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="bg-emerald-700 px-6 pt-14 pb-8 items-center">
          <View className="bg-white rounded-2xl px-5 py-3 mb-3 shadow-sm">
            <Image
              source={require("../../assets/logo.webp")}
              style={{ width: 140, height: 42 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-emerald-100 text-sm">Create your account</Text>
        </View>

        <View className="flex-1 px-6 pt-6 pb-10">
          <Text className="text-center text-xs text-gray-500 mb-5">
            Use your company email only: {domainsHint}
          </Text>

          {serverError ? (
            <View className="bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4">
              <Text className="text-red-700 text-xs">{serverError}</Text>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              Full name
            </Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-xl px-3 h-12 text-sm text-gray-900 bg-gray-50"
                  placeholder="Jane Doe"
                  placeholderTextColor="#9ca3af"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.name.message}
              </Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              Work email
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-xl px-3 h-12 text-sm text-gray-900 bg-gray-50"
                  placeholder="you@uthabitiafrica.org"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              Password
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 bg-gray-50">
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="flex-1 h-12 text-sm text-gray-900"
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry={!showPassword}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              Confirm password
            </Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="border border-gray-300 rounded-xl px-3 h-12 text-sm text-gray-900 bg-gray-50"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.confirmPassword && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            className={`bg-emerald-700 rounded-xl h-12 items-center justify-center ${
              isSubmitting ? "opacity-70" : ""
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Create account
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-5 items-center"
          >
            <Text className="text-sm text-gray-600">
              Already have an account?{" "}
              <Text className="text-emerald-700 font-medium">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
