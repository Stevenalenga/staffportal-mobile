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
import { expensesApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type Expense = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  status: string;
  expenseDate: string;
  user: { name: string | null };
  category: { name: string };
};

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  DRAFT: { label: "Draft", color: "#6b7280", bg: "#f3f4f6" },
  SUBMITTED: { label: "Submitted", color: "#2563eb", bg: "#eff6ff" },
  UNDER_REVIEW: { label: "Under Review", color: "#ca8a04", bg: "#fefce8" },
  APPROVED: { label: "Approved", color: "#047857", bg: "#ecfdf5" },
  REJECTED: { label: "Rejected", color: "#dc2626", bg: "#fef2f2" },
  PAID: { label: "Paid", color: "#047857", bg: "#ecfdf5" },
};

function ExpenseCard({ item }: { item: Expense }) {
  const status = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.DRAFT;
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text
            className="font-semibold text-gray-900 text-sm"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text className="text-gray-500 text-xs mt-0.5">
            {item.category.name} · {item.user.name}
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
    </View>
  );
}

export default function ExpensesScreen() {
  const { data: expenses = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["expenses"],
    queryFn: expensesApi.list,
  });

  const pending = expenses.filter((e: Expense) => e.status === "SUBMITTED").length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">Expenses</Text>
          <TouchableOpacity className="bg-emerald-700 rounded-xl px-4 h-9 items-center justify-center flex-row gap-1.5">
            <Ionicons name="add" size={16} color="white" />
            <Text className="text-white text-sm font-medium">New Claim</Text>
          </TouchableOpacity>
        </View>
        {pending > 0 && (
          <View className="mt-3 bg-orange-50 rounded-xl px-3 py-2 flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={16} color="#ea580c" />
            <Text className="text-orange-700 text-xs font-medium">
              {pending} expense{pending !== 1 ? "s" : ""} awaiting approval
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
          keyExtractor={(item: Expense) => item.id}
          renderItem={({ item }) => <ExpenseCard item={item} />}
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
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
