import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  expensesApi,
  type ExpenseWorkflowAction,
  type PendingUpload,
} from "@/lib/api";
import {
  canPerformExpenseAction,
  formatCurrency,
  formatDate,
  getExpenseStatusStyle,
} from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const WORKFLOW_STEPS = [
  { key: "DRAFT", label: "Draft" },
  { key: "SUBMITTED", label: "Finance" },
  { key: "FINANCE_APPROVED", label: "CEO" },
  { key: "APPROVED", label: "Approved" },
  { key: "DISBURSED", label: "Disbursed" },
] as const;

function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { error?: string } }; message?: string };
  return e?.response?.data?.error ?? e?.message ?? "Something went wrong.";
}

function WorkflowStepper({ status }: { status: string }) {
  const style = getExpenseStatusStyle(status);
  const isRejected = status === "REJECTED";
  const currentStage = style.stage;

  if (isRejected) {
    return (
      <View className="bg-red-50 rounded-2xl p-4 border border-red-100">
        <View className="flex-row items-center gap-2">
          <Ionicons name="close-circle" size={20} color="#dc2626" />
          <Text className="text-red-700 font-semibold text-sm">Rejected</Text>
        </View>
        <Text className="text-red-600 text-xs mt-1">
          This claim was rejected in the approval pipeline.
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100">
      <View className="flex-row items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const done = currentStage > index;
          const active = currentStage === index;
          const color = done || active ? "#047857" : "#d1d5db";

          return (
            <View key={step.key} className="flex-1 items-center">
              <View className="flex-row items-center w-full">
                {index > 0 && (
                  <View
                    className="flex-1 h-0.5"
                    style={{
                      backgroundColor:
                        currentStage >= index ? "#047857" : "#e5e7eb",
                    }}
                  />
                )}
                <View
                  className="w-6 h-6 rounded-full items-center justify-center"
                  style={{
                    backgroundColor:
                      done || active ? "#ecfdf5" : "#f9fafb",
                    borderWidth: 1.5,
                    borderColor: color,
                  }}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={12} color="#047857" />
                  ) : (
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color }}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                {index < WORKFLOW_STEPS.length - 1 && (
                  <View
                    className="flex-1 h-0.5"
                    style={{
                      backgroundColor:
                        currentStage > index ? "#047857" : "#e5e7eb",
                    }}
                  />
                )}
              </View>
              <Text
                className={`text-[10px] mt-1.5 ${
                  active || done
                    ? "text-emerald-700 font-medium"
                    : "text-gray-400"
                }`}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [uploading, setUploading] = useState(false);

  const {
    data: expense,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useQuery({
    queryKey: ["expense", id],
    queryFn: () => expensesApi.get(id!),
    enabled: !!id,
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["expense", id] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  };

  const submitMutation = useMutation({
    mutationFn: () => expensesApi.submit(id!),
    onSuccess: async () => {
      await invalidate();
      Alert.alert("Submitted", "Claim sent to Finance for review.");
    },
    onError: (err) => Alert.alert("Error", errorMessage(err)),
  });

  const workflowMutation = useMutation({
    mutationFn: ({
      action,
      reason,
    }: {
      action: ExpenseWorkflowAction;
      reason?: string;
    }) => expensesApi.workflow(id!, action, reason),
    onSuccess: async () => {
      setRejectOpen(false);
      setRejectReason("");
      await invalidate();
    },
    onError: (err) => Alert.alert("Error", errorMessage(err)),
  });

  const role = user?.role ?? "";
  const ownsClaim = !!user?.id && expense?.user?.id === user.id;
  const isDraft = expense?.status === "DRAFT";

  const actions = useMemo(() => {
    if (!expense) return [];
    const list: {
      action: ExpenseWorkflowAction;
      label: string;
      icon: React.ComponentProps<typeof Ionicons>["name"];
      tone: "emerald" | "red" | "blue";
    }[] = [];

    if (canPerformExpenseAction(role, expense.status, "finance_approve")) {
      list.push({
        action: "finance_approve",
        label: "Finance Approve",
        icon: "checkmark-circle-outline",
        tone: "emerald",
      });
    }
    if (canPerformExpenseAction(role, expense.status, "ceo_approve")) {
      list.push({
        action: "ceo_approve",
        label: "CEO Approve",
        icon: "shield-checkmark-outline",
        tone: "blue",
      });
    }
    if (canPerformExpenseAction(role, expense.status, "disburse")) {
      list.push({
        action: "disburse",
        label: "Disburse",
        icon: "cash-outline",
        tone: "emerald",
      });
    }
    if (canPerformExpenseAction(role, expense.status, "reject")) {
      list.push({
        action: "reject",
        label: "Reject",
        icon: "close-circle-outline",
        tone: "red",
      });
    }
    return list;
  }, [expense, role]);

  const lineTotal = useMemo(() => {
    if (!expense?.lineItems?.length) return expense?.amount ?? 0;
    return expense.lineItems.reduce(
      (sum, item) =>
        sum +
        (item.cost ??
          (Number(item.quantity) || 0) * (Number(item.unitCost) || 0)),
      0
    );
  }, [expense]);

  const pickAndUpload = async (source: "image" | "document") => {
    if (!id) return;
    try {
      let files: PendingUpload[] = [];

      if (source === "image") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permission required",
            "Allow photo library access to attach files."
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.85,
          allowsMultipleSelection: true,
        });
        if (result.canceled) return;
        files = result.assets.map((asset, idx) => {
          const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
          return {
            uri: asset.uri,
            name:
              asset.fileName ??
              `receipt-${Date.now()}-${idx}.${ext === "png" ? "png" : "jpg"}`,
            mimeType:
              asset.mimeType ??
              (ext === "png" ? "image/png" : "image/jpeg"),
            kind: "RECEIPT" as const,
          };
        });
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: ["image/*", "application/pdf"],
          multiple: true,
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        files = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? "application/octet-stream",
          kind: "RECEIPT" as const,
        }));
      }

      if (files.length === 0) return;

      setUploading(true);
      await expensesApi.uploadAttachments(id, files);
      await invalidate();
    } catch (err) {
      Alert.alert("Upload failed", errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const confirmWorkflow = (action: ExpenseWorkflowAction) => {
    if (action === "reject") {
      setRejectReason("");
      setRejectOpen(true);
      return;
    }

    const labels: Record<string, string> = {
      finance_approve: "Approve this claim for Finance?",
      ceo_approve: "Approve this claim as CEO?",
      disburse: "Mark this claim as disbursed?",
    };

    Alert.alert("Confirm", labels[action] ?? "Proceed with this action?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => workflowMutation.mutate({ action }),
      },
    ]);
  };

  const handleReject = () => {
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      Alert.alert("Required", "Please provide a rejection reason.");
      return;
    }
    workflowMutation.mutate({ action: "reject", reason });
  };

  const handleSubmitDraft = () => {
    const receipts =
      expense?.attachments?.filter((a) => a.kind === "RECEIPT") ?? [];
    if (receipts.length < 1) {
      Alert.alert(
        "Receipt required",
        "Upload at least one receipt before submitting."
      );
      return;
    }
    Alert.alert("Submit claim", "Send this draft to Finance for approval?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit",
        onPress: () => submitMutation.mutate(),
      },
    ]);
  };

  if (!id) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-gray-500 text-sm">Missing expense id.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !expense) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
        <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100 flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">Claim</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={40} color="#d1d5db" />
          <Text className="text-gray-500 text-sm mt-3 text-center">
            Could not load this expense claim.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            className="mt-4 bg-emerald-700 rounded-xl px-4 h-10 items-center justify-center"
          >
            <Text className="text-white text-sm font-medium">Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getExpenseStatusStyle(expense.status);
  const claimLabel =
    expense.claimType === "REFUND" ? "Refund" : "Expense";

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
            <Text
              className="text-lg font-bold text-gray-900"
              numberOfLines={1}
            >
              {expense.title}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              IRF claim detail
            </Text>
          </View>
          <View
            className="rounded-full px-2.5 py-1"
            style={{ backgroundColor: status.bg }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: status.color }}
            >
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#047857"
          />
        }
      >
        {/* Summary */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
          <Text className="text-2xl font-bold text-gray-900">
            {formatCurrency(expense.amount, expense.currency)}
          </Text>
          <View className="mt-3 gap-1.5">
            <MetaRow
              icon="pricetag-outline"
              label="Claim type"
              value={claimLabel}
            />
            <MetaRow
              icon="folder-outline"
              label="Project"
              value={expense.projectName ?? expense.category?.name ?? "—"}
            />
            <MetaRow
              icon="calendar-outline"
              label="Date"
              value={formatDate(expense.expenseDate)}
            />
            <MetaRow
              icon="person-outline"
              label="Requester"
              value={expense.user?.name ?? "—"}
            />
          </View>
          {expense.purpose ? (
            <View className="mt-3 pt-3 border-t border-gray-50">
              <Text className="text-xs font-medium text-gray-500 mb-1">
                Purpose
              </Text>
              <Text className="text-sm text-gray-800">{expense.purpose}</Text>
            </View>
          ) : null}
          {expense.notes ? (
            <View className="mt-2">
              <Text className="text-xs font-medium text-gray-500 mb-1">
                Notes
              </Text>
              <Text className="text-sm text-gray-600">{expense.notes}</Text>
            </View>
          ) : null}
          {expense.rejectionReason ? (
            <View className="mt-3 bg-red-50 rounded-xl px-3 py-2">
              <Text className="text-xs font-medium text-red-700 mb-0.5">
                Rejection reason
              </Text>
              <Text className="text-sm text-red-600">
                {expense.rejectionReason}
              </Text>
            </View>
          ) : null}
        </View>

        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Workflow
        </Text>
        <View className="mb-4">
          <WorkflowStepper status={expense.status} />
        </View>

        {/* Line items */}
        <Text className="text-sm font-semibold text-gray-900 mb-2">
          Line items
        </Text>
        {(expense.lineItems?.length ?? 0) === 0 ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
            <Text className="text-gray-400 text-xs">No line items</Text>
          </View>
        ) : (
          <View className="mb-4">
            {expense.lineItems!.map((item, index) => {
              const cost =
                item.cost ??
                (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);
              return (
                <View
                  key={item.id ?? `${index}`}
                  className="bg-white rounded-2xl p-3 mb-2 border border-gray-100"
                >
                  <Text className="text-sm font-medium text-gray-900">
                    {item.specification}
                  </Text>
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {item.itemDate ? `${formatDate(item.itemDate)} · ` : ""}
                    Qty {item.quantity} × {formatCurrency(item.unitCost)}
                  </Text>
                  <Text className="text-xs font-semibold text-gray-800 mt-1 text-right">
                    {formatCurrency(cost)}
                  </Text>
                </View>
              );
            })}
            <View className="bg-emerald-50 rounded-xl px-3 py-2 flex-row justify-between">
              <Text className="text-emerald-800 text-sm font-medium">
                Total
              </Text>
              <Text className="text-emerald-800 text-sm font-bold">
                {formatCurrency(lineTotal, expense.currency)}
              </Text>
            </View>
          </View>
        )}

        {/* Attachments */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-gray-900">
            Attachments
          </Text>
          {isDraft && ownsClaim && (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => pickAndUpload("image")}
                disabled={uploading}
                className="flex-row items-center gap-1"
              >
                <Ionicons name="image-outline" size={14} color="#047857" />
                <Text className="text-emerald-700 text-xs font-medium">
                  Photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickAndUpload("document")}
                disabled={uploading}
                className="flex-row items-center gap-1"
              >
                <Ionicons name="document-outline" size={14} color="#047857" />
                <Text className="text-emerald-700 text-xs font-medium">
                  File
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {uploading && (
          <View className="mb-2 flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#047857" />
            <Text className="text-xs text-gray-500">Uploading…</Text>
          </View>
        )}

        {(expense.attachments?.length ?? 0) === 0 ? (
          <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-4 items-center">
            <Ionicons name="attach-outline" size={24} color="#d1d5db" />
            <Text className="text-gray-400 text-xs mt-1">No attachments</Text>
          </View>
        ) : (
          <View className="mb-4 gap-2">
            {expense.attachments!.map((att) => (
              <View
                key={att.id}
                className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex-row items-center gap-2"
              >
                <Ionicons
                  name={
                    att.mimeType?.includes("pdf")
                      ? "document-text-outline"
                      : "image-outline"
                  }
                  size={16}
                  color="#6b7280"
                />
                <View className="flex-1">
                  <Text className="text-xs text-gray-800" numberOfLines={1}>
                    {att.fileName}
                  </Text>
                  <Text className="text-[10px] text-gray-400 mt-0.5">
                    {att.kind}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Draft owner actions */}
        {isDraft && ownsClaim && (
          <TouchableOpacity
            onPress={handleSubmitDraft}
            disabled={submitMutation.isPending}
            className={`bg-emerald-700 rounded-xl h-12 items-center justify-center flex-row gap-1.5 mb-3 ${
              submitMutation.isPending ? "opacity-70" : ""
            }`}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name="send-outline" size={16} color="white" />
                <Text className="text-white text-sm font-semibold">
                  Submit to Finance
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Approver actions */}
        {actions.length > 0 && (
          <View className="gap-2">
            {actions.map((a) => {
              const tones = {
                emerald: "bg-emerald-700",
                blue: "bg-blue-600",
                red: "bg-red-600",
              };
              const busy = workflowMutation.isPending;
              return (
                <TouchableOpacity
                  key={a.action}
                  onPress={() => confirmWorkflow(a.action)}
                  disabled={busy}
                  className={`${tones[a.tone]} rounded-xl h-11 items-center justify-center flex-row gap-1.5 ${
                    busy ? "opacity-70" : ""
                  }`}
                >
                  {busy ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name={a.icon} size={16} color="white" />
                      <Text className="text-white text-sm font-semibold">
                        {a.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Reject reason modal */}
      <Modal
        visible={rejectOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectOpen(false)}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-1 bg-black/40 justify-end">
            <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8">
              <Text className="text-base font-bold text-gray-900 mb-1">
                Reject claim
              </Text>
              <Text className="text-xs text-gray-500 mb-3">
                Provide a reason for rejection.
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 min-h-[88px] mb-4"
                placeholder="Reason…"
                placeholderTextColor="#9ca3af"
                value={rejectReason}
                onChangeText={setRejectReason}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setRejectOpen(false)}
                  className="flex-1 bg-gray-100 rounded-xl h-11 items-center justify-center"
                >
                  <Text className="text-gray-700 text-sm font-medium">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReject}
                  disabled={workflowMutation.isPending}
                  className="flex-1 bg-red-600 rounded-xl h-11 items-center justify-center"
                >
                  {workflowMutation.isPending ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-sm font-semibold">
                      Reject
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={icon} size={14} color="#9ca3af" />
      <Text className="text-xs text-gray-400 w-20">{label}</Text>
      <Text className="text-xs text-gray-800 flex-1" numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}
