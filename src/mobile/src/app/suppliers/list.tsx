"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { ChevronLeft, ChevronRight, Plus, User } from "lucide-react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import { Supplier } from "@/models/supplier";
import { SupplierServiceClient } from "@/services/supplierService";
import SnackBar from "@/components/ui/snack-bar";
import { usePagePermission } from "@/lib/usePagePermission";

const PAGE_SIZE = 20;

const COLORS = {
  ink: "#0F172A",
  muted: "#64748B",
  border: "#D9DEE5",
  rowBorder: "#CBD5E1",
  green: "#16794B",
};

export default function SupplierListScreen() {
  const router = useRouter();
  const permissionState = usePagePermission('/suppliers/list');
  const service = React.useMemo(() => new SupplierServiceClient(), []);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadSuppliers = React.useCallback(
    async (nextPage = 1, append = false) => {
      try {
        const items = await service.getSuppliers(nextPage, PAGE_SIZE);
        setSuppliers((current) => (append ? [...current, ...items] : items));
        setPage(nextPage);
        setHasMore(items.length === PAGE_SIZE);
      } catch (error) {
        if (!append) setSuppliers([]);
        SnackBar.Error(
          error instanceof Error ? error.message : "Unable to load suppliers.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [service],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void loadSuppliers();
      return undefined;
    }, [loadSuppliers, permissionState]),
  );

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void loadSuppliers(page + 1, true);
  };

  const listLabel = `Supplier · ${suppliers.length}${hasMore ? "+" : ""}`;

  return (
    <SafeAreaView style={styles.page}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <View style={styles.headerBar}>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New supplier"
          onPress={() => router.push("/suppliers/new")}
          disabled={permissionState !== 'authorized'}
          style={styles.addButton}
        >
          <Plus size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={styles.stateText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadSuppliers();
            }}
            tintColor={COLORS.green}
          />
        }
        onMomentumScrollEnd={({ nativeEvent }) => {
          if (
            nativeEvent.layoutMeasurement.height +
              nativeEvent.contentOffset.y >=
            nativeEvent.contentSize.height - 120
          )
            loadMore();
        }}
      >
        {loading && suppliers.length === 0 ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={COLORS.green} />
          </View>
        ) : suppliers.length === 0 ? (
          <View style={styles.centeredState}>
            <Text style={styles.stateTitle}>No suppliers found</Text>
            <Text style={styles.stateText}>Add a supplier to get started.</Text>
          </View>
        ) : (
          <>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.headerInfo]}>
                {listLabel}
              </Text>
              <Text style={[styles.headerCell, styles.statusColumn]}>
                Status
              </Text>
              <View style={styles.headerChevronSpace} />
            </View>
            {suppliers.map((supplier) => {
              const detail = supplier.phoneNumber || supplier.email || "";
              return (
                <Pressable
                  key={supplier.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Supplier ${supplier.supplierName}`}
                  style={styles.row}
                  onPress={() =>
                    router.push({
                      pathname: "/suppliers/view",
                      params: { id: supplier.id },
                    })
                  }
                >
                  <View style={styles.logoWrapper}>
                    {supplier.logoUrl ? (
                      <Image
                        source={{ uri: supplier.logoUrl }}
                        style={styles.logoImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Icon
                          as={User}
                          size={18}
                          className="text-muted-foreground"
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.infoColumn}>
                    <Text
                      className="text-foreground"
                      style={styles.supplierName}
                      numberOfLines={1}
                    >
                      {supplier.supplierName}
                    </Text>
                    {detail ? (
                      <Text
                        className="text-muted-foreground"
                        style={styles.supplierDetail}
                        numberOfLines={1}
                      >
                        {detail}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.statusColumn}>
                    <View
                      style={[
                        styles.statusPill,
                        supplier.isActive
                          ? styles.statusActive
                          : styles.statusInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          supplier.isActive
                            ? styles.statusTextActive
                            : styles.statusTextInactive,
                        ]}
                      >
                        {supplier.isActive ? "ACTIVE" : "INACTIVE"}
                      </Text>
                    </View>
                  </View>

                  <Icon
                    as={ChevronRight}
                    size={16}
                    className="text-muted-foreground"
                  />
                </Pressable>
              );
            })}
          </>
        )}
        {loadingMore ? (
          <View style={styles.loadMoreRow}>
            <ActivityIndicator size="small" color={COLORS.green} />
          </View>
        ) : null}
      </ScrollView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFFFFF" },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: { minWidth: 44 },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
  },
  addButton: {
    width: 34,
    height: 34,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green,
  },
  scrollView: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  centeredState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 24,
  },
  stateTitle: { fontSize: 15, fontWeight: "700", color: COLORS.ink },
  stateText: { fontSize: 13, color: COLORS.muted, textAlign: "center" },
  tableHeader: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F1F5F9",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerCell: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerInfo: { flex: 1, paddingLeft: 56 },
  headerChevronSpace: { width: 16 },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.rowBorder,
    backgroundColor: "#FFFFFF",
  },
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: { width: "100%", height: "100%" },
  logoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E5E7EB",
  },
  infoColumn: { flex: 1, minWidth: 0, gap: 4 },
  supplierName: { fontSize: 15, fontWeight: "700", color: COLORS.ink },
  supplierDetail: { fontSize: 12, color: COLORS.muted },
  statusColumn: { width: 84, alignItems: "flex-start" },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusActive: { backgroundColor: "#D1FAE5" },
  statusInactive: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  statusTextActive: { color: "#047857" },
  statusTextInactive: { color: "#B91C1C" },
  loadMoreRow: { paddingVertical: 16, alignItems: "center" },
});
