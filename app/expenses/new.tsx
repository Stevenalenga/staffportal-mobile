import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  expensesApi,
  type PendingUpload,
} from "@/lib/api";
import { API_BASE_URL } from "@/lib/config";
import {
  EXPENSE_COMPANY_OPTIONS,
  type ExpenseCompany,
} from "@/lib/expense-companies";
import { formatCurrency } from "@/lib/utils";

const companyValues = EXPENSE_COMPANY_OPTIONS.map((o) => o.value) as [
  ExpenseCompany,
  ...ExpenseCompany[],
];

const lineItemSchema = z.object({
  itemDate: z.string().optional(),
  specification: z.string().min(1, "Specification is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0, "Unit cost must be 0 or more"),
});

const schema = z.object({
  claimType: z.enum(["EXPENSE", "REFUND"]),
  expenseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  projectName: z.enum(companyValues, {
    message: "Select a company / project",
  }),
  purpose: z.string().min(1, "Purpose is required"),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item"),
});

type FormData = z.infer<typeof schema>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function errorMessage(err: unknown): string {
  const e = err as { response?: { data?: { error?: string } }; message?: string };
  return e?.response?.data?.error ?? e?.message ?? "Something went wrong.";
}

export default function NewExpenseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [attachments, setAttachments] = useState<PendingUpload[]>([]);
  const [submitting, setSubmitting] = useState<"draft" | "submit" | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      claimType: "EXPENSE",
      expenseDate: todayIso(),
      purpose: "",
      notes: "",
      lineItems: [
        { itemDate: "", specification: "", quantity: 1, unitCost: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  const claimType = watch("claimType");
  const projectName = watch("projectName");
  const lineItems = watch("lineItems");

  const totalAmount = useMemo(
    () =>
      (lineItems ?? []).reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const cost = Number(item.unitCost) || 0;
        return sum + qty * cost;
      }, 0),
    [lineItems]
  );

  const addAttachment = (file: PendingUpload) => {
    setAttachments((prev) => [...prev, file]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const setAttachmentKind = (
    index: number,
    kind: PendingUpload["kind"]
  ) => {
    setAttachments((prev) =>
      prev.map((f, i) => (i === index ? { ...f, kind } : f))
    );
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission required",
        "Allow photo library access to attach receipts."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: true,
    });

    if (result.canceled) return;

    result.assets.forEach((asset, idx) => {
      const ext = asset.uri.split(".").pop()?.toLowerCase() || "jpg";
      const mime =
        asset.mimeType ??
        (ext === "png" ? "image/png" : "image/jpeg");
      addAttachment({
        uri: asset.uri,
        name:
          asset.fileName ??
          `receipt-${Date.now()}-${idx}.${ext === "png" ? "png" : "jpg"}`,
        mimeType: mime,
        kind: "RECEIPT",
      });
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    result.assets.forEach((asset) => {
      addAttachment({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? "application/octet-stream",
        kind: "RECEIPT",
      });
    });
  };

  const onSave = async (data: FormData, mode: "draft" | "submit") => {
    setFormError(null);

    if (mode === "submit") {
      const receipts = attachments.filter((a) => a.kind === "RECEIPT");
      if (receipts.length < 1) {
        setFormError("Attach at least one receipt before submitting.");
        Alert.alert(
          "Receipt required",
          "Attach at least one receipt before submitting."
        );
        return;
      }
    }

    setSubmitting(mode);
    try {
      const payload = {
        claimType: data.claimType,
        projectName: data.projectName.trim(),
        purpose: data.purpose.trim(),
        expenseDate: data.expenseDate,
        notes: data.notes?.trim() || undefined,
        lineItems: data.lineItems.map((item) => ({
          specification: item.specification.trim(),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          ...(item.itemDate?.trim()
            ? { itemDate: item.itemDate.trim() }
            : {}),
        })),
      };

      const created = await expensesApi.create(payload);

      if (attachments.length > 0) {
        await expensesApi.uploadAttachments(created.id, attachments);
      }

      if (mode === "submit") {
        await expensesApi.submit(created.id);
      }

      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.replace(`/expenses/${created.id}` as Href);
    } catch (err) {
      const msg = errorMessage(err);
      setFormError(msg);
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(null);
    }
  };

  const busy = submitting !== null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top", "left", "right"]}>
      <View className="bg-white px-5 pt-4 pb-4 border-b border-gray-100">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center"
            disabled={busy}
          >
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">New IRF Claim</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Expense reimbursement request
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Claim type */}
          <Text className="text-xs font-medium text-gray-500 mb-1.5">
            Claim type
          </Text>
          <View className="flex-row gap-2 mb-4">
            {(
              [
                { value: "EXPENSE", label: "Expense" },
                { value: "REFUND", label: "Refund" },
              ] as const
            ).map((opt) => {
              const active = claimType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setValue("claimType", opt.value)}
                  className={`flex-1 rounded-xl py-2.5 items-center border ${
                    active
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active ? "text-emerald-700" : "text-gray-600"
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Expense date */}
          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1.5">
              Expense date (YYYY-MM-DD)
            </Text>
            <Controller
              control={control}
              name="expenseDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-3 h-11 text-sm text-gray-900"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                />
              )}
            />
            {errors.expenseDate && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.expenseDate.message}
              </Text>
            )}
          </View>

          {/* Company / project */}
          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1.5">
              Company / project *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {EXPENSE_COMPANY_OPTIONS.map((opt) => {
                const active = projectName === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() =>
                      setValue("projectName", opt.value, { shouldValidate: true })
                    }
                    className={`rounded-full px-3 py-2 border ${
                      active
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        active ? "text-emerald-700" : "text-gray-600"
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {errors.projectName && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.projectName.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => Linking.openURL(`${API_BASE_URL}/forms/irf-form.pdf`)}
            className="flex-row items-center gap-1.5 mb-4"
          >
            <Ionicons name="document-outline" size={14} color="#047857" />
            <Text className="text-emerald-700 text-xs font-medium">
              Download blank IRF form (PDF)
            </Text>
          </TouchableOpacity>

          {/* Purpose */}
          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1.5">
              Purpose *
            </Text>
            <Controller
              control={control}
              name="purpose"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 min-h-[88px]"
                  placeholder="Describe the purpose of this claim"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  textAlignVertical="top"
                />
              )}
            />
            {errors.purpose && (
              <Text className="text-red-500 text-xs mt-1">
                {errors.purpose.message}
              </Text>
            )}
          </View>

          {/* Line items */}
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-semibold text-gray-900">
              Line items
            </Text>
            <TouchableOpacity
              onPress={() =>
                append({
                  itemDate: "",
                  specification: "",
                  quantity: 1,
                  unitCost: 0,
                })
              }
              className="flex-row items-center gap-1"
            >
              <Ionicons name="add-circle-outline" size={16} color="#047857" />
              <Text className="text-emerald-700 text-xs font-medium">Add</Text>
            </TouchableOpacity>
          </View>

          {fields.map((field, index) => {
            const qty = Number(lineItems?.[index]?.quantity) || 0;
            const unit = Number(lineItems?.[index]?.unitCost) || 0;
            const lineCost = qty * unit;

            return (
              <View
                key={field.id}
                className="bg-white rounded-2xl p-3 mb-3 border border-gray-100"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-medium text-gray-500">
                    Item {index + 1}
                  </Text>
                  {fields.length > 1 && (
                    <TouchableOpacity onPress={() => remove(index)}>
                      <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text className="text-xs text-gray-500 mb-1">
                  Item date (optional)
                </Text>
                <Controller
                  control={control}
                  name={`lineItems.${index}.itemDate`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 text-sm text-gray-900 mb-2"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9ca3af"
                      value={value ?? ""}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                    />
                  )}
                />

                <Text className="text-xs text-gray-500 mb-1">
                  Specification *
                </Text>
                <Controller
                  control={control}
                  name={`lineItems.${index}.specification`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 text-sm text-gray-900 mb-2"
                      placeholder="What was purchased / spent"
                      placeholderTextColor="#9ca3af"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  )}
                />
                {errors.lineItems?.[index]?.specification && (
                  <Text className="text-red-500 text-xs mb-2">
                    {errors.lineItems[index]?.specification?.message}
                  </Text>
                )}

                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">Qty *</Text>
                    <Controller
                      control={control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 text-sm text-gray-900"
                          placeholder="1"
                          placeholderTextColor="#9ca3af"
                          keyboardType="decimal-pad"
                          value={String(value ?? "")}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      )}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-gray-500 mb-1">
                      Unit cost *
                    </Text>
                    <Controller
                      control={control}
                      name={`lineItems.${index}.unitCost`}
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          className="bg-gray-50 border border-gray-200 rounded-xl px-3 h-10 text-sm text-gray-900"
                          placeholder="0"
                          placeholderTextColor="#9ca3af"
                          keyboardType="decimal-pad"
                          value={String(value ?? "")}
                          onChangeText={onChange}
                          onBlur={onBlur}
                        />
                      )}
                    />
                  </View>
                </View>

                <Text className="text-xs text-gray-600 mt-2 text-right">
                  Line: {formatCurrency(lineCost)}
                </Text>
              </View>
            );
          })}

          <View className="bg-emerald-50 rounded-xl px-3 py-2.5 mb-4 flex-row items-center justify-between">
            <Text className="text-emerald-800 text-sm font-medium">Total</Text>
            <Text className="text-emerald-800 text-base font-bold">
              {formatCurrency(totalAmount)}
            </Text>
          </View>

          {/* Notes */}
          <View className="mb-4">
            <Text className="text-xs font-medium text-gray-500 mb-1.5">
              Notes (optional)
            </Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-900 min-h-[72px]"
                  placeholder="Additional notes"
                  placeholderTextColor="#9ca3af"
                  value={value ?? ""}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  textAlignVertical="top"
                />
              )}
            />
          </View>

          {/* Attachments */}
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-gray-900">
              Attachments
            </Text>
            <Text className="text-xs text-gray-400">≥1 receipt to submit</Text>
          </View>

          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity
              onPress={pickImage}
              className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
            >
              <Ionicons name="image-outline" size={16} color="#047857" />
              <Text className="text-emerald-700 text-xs font-medium">Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickDocument}
              className="flex-1 bg-white border border-gray-200 rounded-xl py-2.5 flex-row items-center justify-center gap-1.5"
            >
              <Ionicons name="document-outline" size={16} color="#047857" />
              <Text className="text-emerald-700 text-xs font-medium">
                File / PDF
              </Text>
            </TouchableOpacity>
          </View>

          {attachments.length === 0 ? (
            <View className="bg-white rounded-2xl border border-dashed border-gray-200 py-6 items-center mb-4">
              <Ionicons name="attach-outline" size={28} color="#d1d5db" />
              <Text className="text-gray-400 text-xs mt-2">
                No attachments yet
              </Text>
            </View>
          ) : (
            <View className="mb-4 gap-2">
              {attachments.map((file, index) => (
                <View
                  key={`${file.uri}-${index}`}
                  className="bg-white rounded-xl border border-gray-100 px-3 py-2.5"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={
                        file.mimeType.includes("pdf")
                          ? "document-text-outline"
                          : "image-outline"
                      }
                      size={16}
                      color="#6b7280"
                    />
                    <Text
                      className="flex-1 text-xs text-gray-800"
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                    <TouchableOpacity onPress={() => removeAttachment(index)}>
                      <Ionicons name="close-circle" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row gap-2 mt-2">
                    {(
                      [
                        { value: "RECEIPT", label: "Receipt" },
                        { value: "IRF_FORM", label: "IRF Form" },
                      ] as const
                    ).map((opt) => {
                      const active = file.kind === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => setAttachmentKind(index, opt.value)}
                          className={`rounded-full px-2.5 py-1 border ${
                            active
                              ? "border-emerald-600 bg-emerald-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-medium ${
                              active ? "text-emerald-700" : "text-gray-500"
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {formError ? (
            <Text className="text-red-600 text-xs mb-3">{formError}</Text>
          ) : null}

          <View className="flex-row gap-2 mt-1">
            <TouchableOpacity
              onPress={handleSubmit((data) => onSave(data, "draft"))}
              disabled={busy}
              className={`flex-1 bg-white border border-gray-200 rounded-xl h-12 items-center justify-center ${
                busy ? "opacity-60" : ""
              }`}
            >
              {submitting === "draft" ? (
                <ActivityIndicator color="#047857" />
              ) : (
                <Text className="text-gray-800 text-sm font-semibold">
                  Save as Draft
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit((data) => onSave(data, "submit"))}
              disabled={busy}
              className={`flex-1 bg-emerald-700 rounded-xl h-12 items-center justify-center flex-row gap-1.5 ${
                busy ? "opacity-70" : ""
              }`}
            >
              {submitting === "submit" ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="send-outline" size={16} color="white" />
                  <Text className="text-white text-sm font-semibold">
                    Submit Claim
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
