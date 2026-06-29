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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assetAssignmentsApi,
  type AssignmentAsset,
} from "@/lib/api";
import { formatDate, getAssetStatusStyle } from "@/lib/utils";

type ActionType = "assign" | "transfer" | "return" | null;

function AssignmentCard({
  item,
  onAction,
}: {
  item: AssignmentAsset;
  onAction: (action: ActionType, asset: AssignmentAsset) => void;
}) {
  const status = getAssetStatusStyle(item.status);
  const activeAssignment = item.assignments[0];
  const canAct =
    item.status !== "IN_MAINTENANCE" &&
    item.status !== "RETIRED" &&
    item.status !== "LOST";

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
      <View className="flex-row items-start justify-between mb-2">
        <Text className="font-mono text-xs font-bold text-emerald-700">
          {item.assetTag}
        </Text>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: status.bg }}>
          <Text className="text-xs font-medium" style={{ color: status.color }}>
            {status.label}
          </Text>
        </View>
      </View>

      <Text className="font-semibold text-gray-900 text-sm">{item.name}</Text>
      {(item.brand || item.model) && (
        <Text className="text-gray-500 text-xs mt-0.5">
          {[item.brand, item.model].filter(Boolean).join(" · ")}
        </Text>
      )}

      <View className="mt-2 gap-1">
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="person-outline" size={12} color="#9ca3af" />
          <Text className="text-xs text-gray-600">
            {item.staffInCharge ?? "Unassigned"}
          </Text>
        </View>
        {item.location && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-600">{item.location}</Text>
          </View>
        )}
        {activeAssignment && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="calendar-outline" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-500">
              Assigned {formatDate(activeAssignment.assignedAt)}
            </Text>
          </View>
        )}
      </View>

      {canAct && (
        <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-50">
          {item.status !== "ASSIGNED" ? (
            <TouchableOpacity
              onPress={() => onAction("assign", item)}
              className="flex-1 flex-row items-center justify-center gap-1 bg-emerald-50 rounded-xl py-2"
            >
              <Ionicons name="person-add-outline" size={14} color="#047857" />
              <Text className="text-emerald-700 text-xs font-medium">Assign</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                onPress={() => onAction("transfer", item)}
                className="flex-1 flex-row items-center justify-center gap-1 bg-blue-50 rounded-xl py-2"
              >
                <Ionicons name="swap-horizontal-outline" size={14} color="#2563eb" />
                <Text className="text-blue-700 text-xs font-medium">Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onAction("return", item)}
                className="flex-1 flex-row items-center justify-center gap-1 bg-amber-50 rounded-xl py-2"
              >
                <Ionicons name="return-down-back-outline" size={14} color="#d97706" />
                <Text className="text-amber-700 text-xs font-medium">Return</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function AssignmentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [action, setAction] = useState<ActionType>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssignmentAsset | null>(null);
  const [staffName, setStaffName] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["asset-assignments"],
    queryFn: assetAssignmentsApi.list,
  });

  const mutation = useMutation({
    mutationFn: assetAssignmentsApi.action,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setAction(null);
      setSelectedAsset(null);
      setStaffName("");
      setNotes("");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      Alert.alert(
        "Error",
        err.response?.data?.error ?? "Something went wrong. Please try again."
      );
    },
  });

  const openAction = (type: ActionType, asset: AssignmentAsset) => {
    setAction(type);
    setSelectedAsset(asset);
    setStaffName("");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!selectedAsset || !action) return;

    if (action !== "return" && !staffName.trim()) {
      Alert.alert("Required", "Please enter the staff member's name.");
      return;
    }

    if (action === "return") {
      Alert.alert(
        "Confirm Return",
        `Return ${selectedAsset.assetTag} from ${selectedAsset.staffInCharge ?? "current holder"}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Return",
            onPress: () =>
              mutation.mutate({
                assetId: selectedAsset.id,
                action: "return",
                notes: notes.trim() || undefined,
              }),
          },
        ]
      );
      return;
    }

    mutation.mutate({
      assetId: selectedAsset.id,
      action,
      staffName: staffName.trim(),
      notes: notes.trim() || undefined,
    });
  };

  const assets = data?.assets ?? [];
  const summary = data?.summary;

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
            <Text className="text-xl font-bold text-gray-900">Assignments</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Assign, transfer or return assets
            </Text>
          </View>
        </View>

        {summary && (
          <View className="flex-row gap-2 mt-3">
            {[
              { label: "Total", value: summary.total, color: "#374151" },
              { label: "Assigned", value: summary.assigned, color: "#2563eb" },
              { label: "Available", value: summary.available, color: "#047857" },
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
          data={assets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AssignmentCard item={item} onAction={openAction} />
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
              <Ionicons name="swap-horizontal-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">No assets found</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!action} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end bg-black/40"
        >
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <View>
                <Text className="text-base font-bold text-gray-900 capitalize">
                  {action === "return"
                    ? "Return Asset"
                    : action === "transfer"
                    ? "Transfer Asset"
                    : "Assign Asset"}
                </Text>
                {selectedAsset && (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {selectedAsset.assetTag} — {selectedAsset.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setAction(null)}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
              {action === "return" ? (
                <View className="bg-amber-50 rounded-xl p-3 mb-4 border border-amber-100">
                  <Text className="text-amber-800 text-sm">
                    This will mark the asset as returned and set it to Available.
                  </Text>
                </View>
              ) : (
                <>
                  {action === "transfer" && selectedAsset?.staffInCharge && (
                    <View className="bg-gray-50 rounded-xl p-3 mb-4">
                      <Text className="text-xs text-gray-600">
                        Currently held by:{" "}
                        <Text className="font-semibold">
                          {selectedAsset.staffInCharge}
                        </Text>
                      </Text>
                    </View>
                  )}
                  <Text className="text-xs font-medium text-gray-700 mb-1.5">
                    Staff Name *
                  </Text>
                  <TextInput
                    value={staffName}
                    onChangeText={setStaffName}
                    placeholder="e.g. John Doe"
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-4"
                  />
                </>
              )}

              <Text className="text-xs font-medium text-gray-700 mb-1.5">
                Notes (optional)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes..."
                multiline
                numberOfLines={3}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm mb-6"
                style={{ textAlignVertical: "top", minHeight: 72 }}
              />
            </ScrollView>

            <View className="flex-row gap-3 px-5 pb-8 pt-3 border-t border-gray-100">
              <TouchableOpacity
                onPress={() => setAction(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={mutation.isPending}
                className={`flex-1 py-3 rounded-xl items-center ${
                  action === "return"
                    ? "bg-amber-600"
                    : action === "transfer"
                    ? "bg-blue-600"
                    : "bg-emerald-700"
                }`}
              >
                {mutation.isPending ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-medium">
                    {action === "return"
                      ? "Confirm Return"
                      : action === "transfer"
                      ? "Transfer"
                      : "Assign"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
