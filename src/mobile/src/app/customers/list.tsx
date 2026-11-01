"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MapPin,
  Plus,
  Search,
  User,
} from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from 'nativewind';

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import { container, DI_TOKENS } from "@/di";
import { usePagePermission } from "@/lib/usePagePermission";
import { CustomerItem } from "@/models/customer";
import { ICustomerService } from "@/services/customerService";
import LoadingOverlay from "@/components/loadingOverlay";
import { THEME } from '@/lib/theme';

const customerService = container.resolve<ICustomerService>(
  DI_TOKENS.ICustomerService,
);

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

function formatMoney(amount: number | undefined) {
  return `${(amount ?? 0).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })} MMK`;
}

export default function CustomerListScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/customers/list');
  const [customers, setCustomers] = React.useState<CustomerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [searchText, setSearchText] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<
    "all" | "active" | "inactive"
  >("all");
  const pageSize = 20;

  const loadCustomers = React.useCallback(
    async (
      nextPage = 1,
      reset = false,
      name?: string,
      isActiveFilter?: boolean,
    ) => {
      if (nextPage === 1 && !reset) {
        setLoading(true);
      }

      try {
        const result = await customerService.getCustomers(
          nextPage,
          pageSize,
          name,
          isActiveFilter,
        );
        if (reset) {
          setCustomers(result);
        } else {
          setCustomers((prev) => [...prev, ...result]);
        }
        setHasMore(result.length === pageSize);
        setPage(nextPage);
      } catch (error) {
        if (reset) {
          setCustomers([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  const fetchCustomers = React.useCallback(async () => {
    if (permissionState !== 'authorized') return;
    setLoading(true);
    setCustomers([]);
    try {
      const result = await customerService.getCustomers(
        1,
        pageSize,
        searchText.trim(),
        activeFilter === "active"
          ? true
          : activeFilter === "inactive"
            ? false
            : undefined,
      );
      setCustomers(result);
      setHasMore(result.length === pageSize);
      setPage(1);
    } catch (error) {
      setCustomers([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, pageSize, permissionState, searchText]);

  React.useEffect(() => {
    if (permissionState === 'authorized') fetchCustomers();
  }, [fetchCustomers]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState === 'authorized') fetchCustomers();
      return undefined;
    }, [fetchCustomers, permissionState]),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCustomers(
      1,
      true,
      searchText.trim(),
      activeFilter === "active"
        ? true
        : activeFilter === "inactive"
          ? false
          : undefined,
    );
  }, [loadCustomers, searchText, activeFilter]);

  const onLoadMore = React.useCallback(() => {
    if (loadingMore || !hasMore || loading) {
      return;
    }

    setLoadingMore(true);
    loadCustomers(
      page + 1,
      false,
      searchText.trim(),
      activeFilter === "active"
        ? true
        : activeFilter === "inactive"
          ? false
          : undefined,
    );
  }, [
    loadingMore,
    hasMore,
    loading,
    loadCustomers,
    page,
    searchText,
    activeFilter,
  ]);

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar />
      <LoadingOverlay isLoading={loading} />

      <View
        className="bg-background border-b border-border"
        style={styles.headerBar}
      >
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          Customers
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New customer"
          onPress={() => router.push("/customers/new")}
          disabled={permissionState !== 'authorized'}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Plus size={18} color={theme.primaryForeground} />
        </Pressable>
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : <>
      <View style={[styles.toolbar, { backgroundColor: theme.card }]}>
        <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.muted }]}>
          <Icon className="text-muted-foreground" as={Search} size={16} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by customer name"
            placeholderTextColor={theme.mutedForeground}
            style={[styles.searchInput, { color: theme.foreground }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((filter) => {
            const isSelected = activeFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setActiveFilter(filter.key)}
                style={[
                  styles.filterChip,
                  isSelected && { borderColor: theme.primary, backgroundColor: theme.secondary },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isSelected ? theme.primary : theme.mutedForeground },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading && customers.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>
            Loading customers...
          </Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>
            No customers found
          </Text>
          <Text className="text-muted-foreground" style={styles.stateText}>
            Add a customer to get started.
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderColor: theme.border }]}>
            <Text style={[styles.headerCell, styles.headerInfo]}>
              {`Customer · ${customers.length}${hasMore ? "+" : ""}`}
            </Text>
            <Text style={[styles.headerCell, styles.amountColumn]}>
              Outstanding
            </Text>
            <View style={styles.headerChevronSpace} />
          </View>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onMomentumScrollEnd={(event) => {
              const { layoutMeasurement, contentOffset, contentSize } =
                event.nativeEvent;
              const isNearBottom =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 120;
              if (isNearBottom) {
                onLoadMore();
              }
            }}
          >
            {customers.map((customer) => {
              const isActive = customer.isActive !== false;
              const owes = (customer.totalOutstanding ?? 0) > 0;
              return (
                <Pressable
                  key={customer.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Customer ${customer.name}`}
                  style={[
                    styles.row,
                    { borderBottomColor: theme.border, backgroundColor: theme.card },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/customers/view",
                      params: { id: customer.id },
                    })
                  }
                >
                  <View style={[styles.avatarWrap, { backgroundColor: theme.muted }]}>
                    {customer.profilePictureUrl ? (
                      <Image
                        source={{ uri: customer.profilePictureUrl }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={[styles.avatarFallback, { backgroundColor: theme.secondary }]}>
                        <Icon
                          className="text-muted-foreground"
                          as={User}
                          size={18}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.infoColumn}>
                    <View style={styles.nameRow}>
                      <Text
                        className="text-foreground"
                        style={styles.customerName}
                        numberOfLines={1}
                      >
                        {customer.name}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: theme.secondary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: isActive ? theme.chart2 : theme.destructive },
                          ]}
                        >
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon
                        className="text-muted-foreground"
                        as={Phone}
                        size={12}
                      />
                      <Text
                        className="text-muted-foreground"
                        style={styles.customerDetail}
                        numberOfLines={1}
                      >
                        {customer.phone ? customer.phone : "-"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon
                        className="text-muted-foreground"
                        as={MapPin}
                        size={12}
                      />
                      <Text
                        className="text-muted-foreground"
                        style={styles.customerDetail}
                        numberOfLines={1}
                      >
                        {customer.address ? customer.address : "-"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.amountColumn}>
                    <Text
                      style={[
                        styles.outstandingValue,
                        { color: owes ? theme.chart4 : theme.foreground },
                      ]}
                      numberOfLines={1}
                    >
                      {formatMoney(customer.totalOutstanding)}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={theme.mutedForeground} />
                </Pressable>
              );
            })}

            {loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text
                  className="text-muted-foreground"
                  style={styles.loadMoreText}
                >
                  Loading more...
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </>
      )}
      </>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: { minWidth: 44 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
  },
  addButton: {
    width: 34,
    height: 34,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 42,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: {
    flex: 1,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  tableHeader: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerInfo: { flex: 1, paddingLeft: 56 },
  headerChevronSpace: { width: 16 },
  content: { paddingBottom: 24 },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 22 },
  avatarFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  infoColumn: { flex: 1, minWidth: 0, gap: 4 },
  amountColumn: { width: 104, alignItems: "flex-end" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  customerName: { flexShrink: 1, fontSize: 15, fontWeight: "700" },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  customerDetail: { flex: 1, fontSize: 12 },
  statusPill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  outstandingValue: { fontSize: 14, fontWeight: "800" },
  loadMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
  },
  loadMoreText: { fontSize: 12 },
  centeredState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  stateTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  stateText: { fontSize: 13, textAlign: "center", marginTop: 6 },
});
