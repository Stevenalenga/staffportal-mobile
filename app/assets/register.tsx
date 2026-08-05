import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { assetsApi, type Asset } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { canManageAssets } from "@/lib/portal-access";
import {
  formatAssetCategory,
  formatCurrency,
  formatDate,
  getAssetStatusStyle,
} from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "AVAILABLE", label: "Available" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_MAINTENANCE", label: "Maintenance" },
  { value: "RETIRED", label: "Retired" },
  { value: "LOST", label: "Lost" },
];

function matchesSearch(asset: Asset, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const fields = [
    asset.assetTag,
    asset.classification,
    asset.name,
    asset.category,
    formatAssetCategory(asset.category),
    asset.brand,
    asset.model,
    asset.serialNumber,
    asset.supplier,
    asset.staffInCharge,
    asset.location,
    asset.notes,
  ];
  return fields.some((f) => f?.toLowerCase().includes(q));
}

function FilterChip({
  label,
  active,
  onPress,
  activeColor = "emerald",
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  activeColor?: "emerald" | "blue" | "violet";
}) {
  const activeStyles = {
    emerald: { border: "border-emerald-600 bg-emerald-50", text: "text-emerald-700" },
    blue: { border: "border-blue-600 bg-blue-50", text: "text-blue-700" },
    violet: { border: "border-violet-600 bg-violet-50", text: "text-violet-700" },
  };
  const style = activeStyles[activeColor];

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 border ${
        active ? style.border : "border-gray-200 bg-white"
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          active ? style.text : "text-gray-600"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-2">
      <Text className="text-xs font-medium text-gray-500 mb-1.5">{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function AssetCard({ item }: { item: Asset }) {
  const status = getAssetStatusStyle(item.status);

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
      <Text className="text-gray-400 text-xs mt-0.5">
        {formatAssetCategory(item.category)}
        {item.classification ? ` · ${item.classification}` : ""}
      </Text>
      {(item.brand || item.model) && (
        <Text className="text-gray-500 text-xs mt-0.5">
          {[item.brand, item.model].filter(Boolean).join(" · ")}
        </Text>
      )}

      <View className="mt-3 gap-1.5">
        {item.staffInCharge ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="person-outline" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-600">{item.staffInCharge}</Text>
          </View>
        ) : null}
        {item.location ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location-outline" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-600">{item.location}</Text>
          </View>
        ) : null}
        {item.serialNumber ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="barcode-outline" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-600">{item.serialNumber}</Text>
          </View>
        ) : null}
        {item.purchasePrice != null && (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="cash-outline" size={12} color="#9ca3af" />
            <Text className="text-xs text-gray-600">
              {formatCurrency(Number(item.purchasePrice))}
              {item.purchaseDate ? ` · ${formatDate(item.purchaseDate)}` : ""}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function AssetRegisterScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const manager = canManageAssets(user?.role);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [classificationFilter, setClassificationFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: assets = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["assets"],
    queryFn: assetsApi.list,
  });

  const categories = useMemo(
    () => [...new Set(assets.map((a) => a.category))].sort(),
    [assets]
  );

  const classifications = useMemo(
    () =>
      [...new Set(assets.map((a) => a.classification).filter(Boolean))].sort() as string[],
    [assets]
  );

  const locations = useMemo(
    () =>
      [...new Set(assets.map((a) => a.location).filter(Boolean))].sort() as string[],
    [assets]
  );

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      if (!matchesSearch(asset, search)) return false;
      if (statusFilter && asset.status !== statusFilter) return false;
      if (categoryFilter && asset.category !== categoryFilter) return false;
      if (classificationFilter && asset.classification !== classificationFilter) return false;
      if (locationFilter && asset.location !== locationFilter) return false;
      return true;
    });
  }, [
    assets,
    search,
    statusFilter,
    categoryFilter,
    classificationFilter,
    locationFilter,
  ]);

  const filteredValue = useMemo(
    () =>
      filtered.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0),
    [filtered]
  );

  const activeFilterCount = [
    statusFilter,
    categoryFilter,
    classificationFilter,
    locationFilter,
  ].filter(Boolean).length;

  const hasFilters = !!(search || activeFilterCount > 0);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setClassificationFilter("");
    setLocationFilter("");
  };

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
            <Text className="text-xl font-bold text-gray-900">
              {manager ? "Asset Register" : "My assigned assets"}
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {hasFilters
                ? `${filtered.length} of ${assets.length} assets`
                : manager
                  ? `${assets.length} asset${assets.length !== 1 ? "s" : ""} in register`
                  : `${assets.length} asset${assets.length !== 1 ? "s" : ""} assigned to you`}
            </Text>
          </View>
          {hasFilters && (
            <TouchableOpacity
              onPress={clearFilters}
              className="bg-gray-100 rounded-xl px-3 h-9 items-center justify-center"
            >
              <Text className="text-gray-600 text-xs font-medium">Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-3 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-10">
            <Ionicons name="search-outline" size={16} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search tag, name, serial, staff…"
              placeholderTextColor="#9ca3af"
              className="flex-1 ml-2 text-sm text-gray-900"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters((v) => !v)}
            className={`relative h-10 w-10 rounded-xl items-center justify-center border ${
              showFilters || activeFilterCount > 0
                ? "border-emerald-600 bg-emerald-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={showFilters || activeFilterCount > 0 ? "#047857" : "#6b7280"}
            />
            {activeFilterCount > 0 && (
              <View
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 items-center justify-center"
              >
                <Text className="text-white text-[10px] font-bold">
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <FilterRow label="Status">
              {STATUS_FILTERS.map((f) => (
                <FilterChip
                  key={f.value || "all"}
                  label={f.label}
                  active={statusFilter === f.value}
                  onPress={() => setStatusFilter(f.value)}
                />
              ))}
            </FilterRow>

            {categories.length > 0 && (
              <FilterRow label="Category">
                <FilterChip
                  label="All"
                  active={!categoryFilter}
                  onPress={() => setCategoryFilter("")}
                  activeColor="blue"
                />
                {categories.map((cat) => (
                  <FilterChip
                    key={cat}
                    label={formatAssetCategory(cat)}
                    active={categoryFilter === cat}
                    onPress={() => setCategoryFilter(cat)}
                    activeColor="blue"
                  />
                ))}
              </FilterRow>
            )}

            {classifications.length > 0 && (
              <FilterRow label="Classification">
                <FilterChip
                  label="All"
                  active={!classificationFilter}
                  onPress={() => setClassificationFilter("")}
                  activeColor="violet"
                />
                {classifications.map((c) => (
                  <FilterChip
                    key={c}
                    label={c}
                    active={classificationFilter === c}
                    onPress={() => setClassificationFilter(c)}
                    activeColor="violet"
                  />
                ))}
              </FilterRow>
            )}

            {locations.length > 0 && (
              <FilterRow label="Location">
                <FilterChip
                  label="All locations"
                  active={!locationFilter}
                  onPress={() => setLocationFilter("")}
                  activeColor="blue"
                />
                {locations.map((loc) => (
                  <FilterChip
                    key={loc}
                    label={loc}
                    active={locationFilter === loc}
                    onPress={() => setLocationFilter(loc)}
                    activeColor="blue"
                  />
                ))}
              </FilterRow>
            )}
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#047857" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: Asset) => item.id}
          renderItem={({ item }) => <AssetCard item={item} />}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#047857"
            />
          }
          ListHeaderComponent={
            filtered.length > 0 ? (
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs text-gray-400">
                  {filtered.length} asset{filtered.length !== 1 ? "s" : ""}
                  {hasFilters ? " (filtered)" : ""}
                </Text>
                {filteredValue > 0 && (
                  <Text className="text-xs text-gray-500">
                    Value:{" "}
                    <Text className="font-semibold text-gray-700">
                      {formatCurrency(filteredValue)}
                    </Text>
                  </Text>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="cube-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-3 text-sm">
                {hasFilters ? "No assets match your search or filters" : "No assets found"}
              </Text>
              {hasFilters && (
                <TouchableOpacity onPress={clearFilters} className="mt-3">
                  <Text className="text-emerald-700 text-sm font-medium">Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
