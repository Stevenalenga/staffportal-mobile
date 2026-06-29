import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assetMaintenanceApi,
  type MaintenanceRecord,
} from "@/lib/api";
import { formatCurrency, formatDate, MAINTENANCE_TYPE_LABELS } from "@/lib/utils";

const ISSUE_TYPES = [
  { value: "DAMAGE", label: "Damage Report" },
  { value: "REPAIR", label: "Repair Needed" },
  { value: "SERVICING", label: "Servicing" },
  { value: "INSPECTION", label: "Inspection" },
  { value: "OTHER", label: "Other" },
];

function MaintenanceCard({
  item,
  onResolve,
  resolving,
}: {
  item: MaintenanceRecord;
  onResolve: (id: string) => void;
  resolving: boolean;
}) {
  const isOpen = !item.completedAt;
  const typeLabel = MAINTENANCE_TYPE_LABELS[item.type] ?? item.type;

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-start justify-between mb-2">
        <View>
          <Text className="font-mono text-xs font-bold text-emerald-700">
            {item.asset.assetTag}
          </Text>
          <Text className="text-gray-600 text-xs">{item.asset.name}</Text>
        </View>
        <View
          className={`rounded-full px-2 py-0.5 ${
            isOpen ? "bg-amber-50" : "bg-emerald-50"
          }`}
        >
          <Text
            className="text-xs font-medium"
            style={{ color: isOpen ? "#d97706" : "#047857" }}
          >
            {isOpen ? "Pending" : "Resolved"}
          </Text>
        </View>
      </View>

      <View className="bg-red-50 self-start rounded-full px-2 py-0.5 mb-2">
        <Text className="text-red-700 text-xs font-medium">{typeLabel}</Text>
      </View>

      <Text className="text-gray-800 text-sm" numberOfLines={3}>
        {item.description}
      </Text>

      <View className="mt-2 gap-1">
        <Text className="text-xs text-gray-500">
          Reported: {formatDate(item.date)}
        </Text>
        {item.completedAt && (
          <Text className="text-xs text-emerald-600">
            Resolved: {formatDate(item.completedAt)}
          </Text>
        )}
        {item.vendor && (
          <Text className="text-xs text-gray-500">Vendor: {item.vendor}</Text>
        )}
        {item.cost != null && (
          <Text className="text-xs text-gray-500">
            Cost: {formatCurrency(Number(item.cost))}
          </Text>
        )}
      </View>

      {isOpen && (
        <TouchableOpacity
          onPress={() => onResolve(item.id)}
          disabled={resolving}
          className="mt-3 pt-3 border-t border-gray-50 flex-row items-center justify-center gap-1.5 bg-emerald-50 rounded-xl py-2"
        >
          {resolving ? (
            <ActivityIndicator size="small" color="#047857" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={16} color="#047857" />
              <Text className="text-emerald-700 text-xs font-medium">
                Mark as Resolved
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function MaintenanceScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showReport, setShowReport] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    assetId: "",
    type: "DAMAGE",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    cost: "",
    vendor: "",
    markAsInMaintenance: true,
  });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["asset-maintenance"],
    queryFn: assetMaintenanceApi.list,
  });

  const reportMutation = useMutation({
    mutationFn: assetMaintenanceApi.report,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowReport(false);
      setForm({
        assetId: "",
        type: "DAMAGE",
        description: "",
        date: new Date().toISOString().slice(0, 10),
        cost: "",
        vendor: "",
        markAsInMaintenance: true,
      });
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      Alert.alert(
        "Error",
        err.response?.data?.error ?? "Failed to submit report."
      );
    },
  });

  const resolveMutation = useMutation({
    mutationFn: assetMaintenanceApi.resolve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setResolvingId(null);
    },
    onError: () => {
      setResolvingId(null);
      Alert.alert("Error", "Failed to mark as resolved.");
    },
  });

  const handleReport = () => {
    if (!form.assetId) {
      Alert.alert("Required", "Please select an asset.");
      return;
    }
    if (form.description.trim().length < 5) {
      Alert.alert("Required", "Please describe the issue (at least 5 characters).");
      return;
    }

    reportMutation.mutate({
      assetId: form.assetId,
      type: form.type,
      description: form.description.trim(),
      date: form.date,
      cost: form.cost ? Number(form.cost) : undefined,
      vendor: form.vendor.trim() || undefined,
      markAsInMaintenance: form.markAsInMaintenance,
    });
  };

  const handleResolve = (id: string) => {
    Alert.alert(
      "Resolve Issue",
      "Mark this maintenance record as resolved? The asset will be set to Available.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: () => {
            setResolvingId(id);
            resolveMutation.mutate(id);
          },
        },
      ]
    );
  };

  const records = data?.records ?? [];
  const assets = data?.assets ?? [];
  const summary = data?.summary;
  const openRecords = records.filter((r) => !r.completedAt);
  const closedRecords = records.filter((r) => r.completedAt);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Maintenance</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Report & track asset repairs
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowReport(true)}
            className="bg-red-600 rounded-xl px-3 h-9 flex-row items-center gap-1"
          >
            <Ionicons name="alert-circle-outline" size={14} color="white" />
            <Text className="text-white text-xs font-medium">Report</Text>
          </TouchableOpacity>
        </View>

        {summary && (
          <View className="flex-row gap-2 mt-3">
            {[
              { label: "Total", value: summary.total, color: "#374151" },
              { label: "Open", value: summary.open, color: "#dc2626" },
              { label: "Resolved", value: summary.completed, color: "#047857" },
            ].map((s) => (
              <View
                key={s.label}
                className="flex-1 bg-gray-50 rounded-xl px-3 py-2 items-center"
              >
                <Text className="text-xs text-gray-500">{s.label}</Text>
                <Text className="text-lg font-bold" style={{ color: s.color }}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          data={[...openRecords, ...closedRecords]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MaintenanceCard
              item={item}
              onResolve={handleResolve}
              resolving={resolvingId === item.id}
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
          ListHeaderComponent={
            openRecords.length > 0 ? (
              <View className="flex-row items-center gap-1.5 mb-2">
                <Ionicons name="alert-circle" size={14} color="#dc2626" />
                <Text className="text-xs font-semibold text-red-700">
                  {openRecords.length} open issue{openRecords.length !== 1 ? "s" : ""}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="construct-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">
                No maintenance records yet
              </Text>
              <TouchableOpacity
                onPress={() => setShowReport(true)}
                className="mt-4 bg-red-600 rounded-xl px-4 py-2"
              >
                <Text className="text-white text-sm font-medium">Report an Issue</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal visible={showReport} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white rounded-t-3xl max-h-[90%]">
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <View>
                <Text className="text-base font-bold text-gray-900">
                  Report Asset Issue
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Report a damaged or faulty asset
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowReport(false)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
              <Text className="text-xs font-medium text-gray-700 mb-1.5">Asset *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 8 }}
              >
                {assets.map((a) => (
                  <TouchableOpacity
                    key={a.id}
                    onPress={() => setForm((f) => ({ ...f, assetId: a.id }))}
                    className={`rounded-xl px-3 py-2 border ${
                      form.assetId === a.id
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Text
                      className={`font-mono text-xs font-bold ${
                        form.assetId === a.id ? "text-red-700" : "text-gray-700"
                      }`}
                    >
                      {a.assetTag}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">{a.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="text-xs font-medium text-gray-700 mb-1.5">
                Issue Type *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 8 }}
              >
                {ISSUE_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setForm((f) => ({ ...f, type: t.value }))}
                    className={`rounded-full px-3 py-1.5 border ${
                      form.type === t.value
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        form.type === t.value ? "text-red-700" : "text-gray-600"
                      }`}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="text-xs font-medium text-gray-700 mb-1.5">Date *</Text>
              <TextInput
                value={form.date}
                onChangeText={(v) => setForm((f) => ({ ...f, date: v }))}
                placeholder="YYYY-MM-DD"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4"
              />

              <Text className="text-xs font-medium text-gray-700 mb-1.5">
                Description *
              </Text>
              <TextInput
                value={form.description}
                onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                placeholder="Describe the damage or issue..."
                multiline
                numberOfLines={4}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4"
                style={{ textAlignVertical: "top", minHeight: 88 }}
              />

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-700 mb-1.5">
                    Vendor (optional)
                  </Text>
                  <TextInput
                    value={form.vendor}
                    onChangeText={(v) => setForm((f) => ({ ...f, vendor: v }))}
                    placeholder="Repair vendor"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-medium text-gray-700 mb-1.5">
                    Cost (KES)
                  </Text>
                  <TextInput
                    value={form.cost}
                    onChangeText={(v) => setForm((f) => ({ ...f, cost: v }))}
                    placeholder="0"
                    keyboardType="numeric"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-6 bg-gray-50 rounded-xl px-3 py-3">
                <Text className="text-sm text-gray-700 flex-1 mr-3">
                  Mark asset as In Maintenance
                </Text>
                <Switch
                  value={form.markAsInMaintenance}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, markAsInMaintenance: v }))
                  }
                  trackColor={{ true: "#dc2626" }}
                />
              </View>
            </ScrollView>

            <View className="flex-row gap-3 px-5 pb-8 pt-3 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setShowReport(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReport}
                disabled={reportMutation.isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 items-center"
              >
                {reportMutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-medium">Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
