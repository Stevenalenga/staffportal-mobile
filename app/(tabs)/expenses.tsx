import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { expensesApi, type ExpenseListItem } from "@/lib/api";
import { formatCurrency, formatDate, getExpenseStatusStyle } from "@/lib/utils";

function ExpenseCard({
  item,
  onPress,
}: {
  item: ExpenseListItem;
  onPress: () => void;
}) {
  const status = getExpenseStatusStyle(item.status);
  const subtitle = item.projectName ?? item.category.name;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text
            className="font-semibold text-gray-900 text-sm"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
            {subtitle} · {item.user.name ?? "—"}
          </Text>
          <Text className="text-gray-400 text-xs mt-0.5">
            {formatDate(item.expenseDate)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-bold text-gray-900 text-base">
            {formatCurrency(item.amount, item.currency)}
          </Text>
          <View
            className="rounded-full px-2 py-0.5 mt-1.5"
            style={{ backgroundColor: status.bg }}
          >
            <Text className="text-xs font-medium" style={{ color: status.color }}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ExpensesScreen() {
  const router = useRouter();
  const { data: expenses = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["expenses"],
    queryFn: expensesApi.list,
  });

  const pending = expenses.filter(
    (e) =>
      e.status === "SUBMITTED" ||
      e.status === "FINANCE_APPROVED" ||
      e.status === "APPROVED"
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Expenses</Text>
          <TouchableOpacity
            onPress={() => router.push("/expenses/new" as Href)}
            className="bg-emerald-700 rounded-xl px-4 h-9 items-center justify-center flex-row gap-1.5"
          >
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white text-sm font-medium">New Claim</Text>
          </TouchableOpacity>
        </View>
        {pending > 0 && (
          <View className="mt-3 bg-orange-50 rounded-xl px-3 py-2 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={16} color="#ea580c" />
            <Text className="text-orange-700 text-xs font-medium">
              {pending} claim{pending !== 1 ? "s" : ""} in approval pipeline
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseCard
              item={item}
              onPress={() => router.push(`/expenses/${item.id}` as Href)}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#047857"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">
                No expense claims yet
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/expenses/new" as Href)}
                className="mt-4 bg-emerald-700 rounded-xl px-4 h-10 items-center justify-center"
              >
                <Text className="text-white text-sm font-medium">
                  Create IRF claim
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
