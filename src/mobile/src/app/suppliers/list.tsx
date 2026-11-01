"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import { ChevronLeft, ChevronRight, Plus, User } from "lucide-react-native";
import { useColorScheme } from 'nativewind';
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
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

const PAGE_SIZE = 20;

export default function SupplierListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
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
            error instanceof Error ? error.message : t('suppliers.messages.unableLoad'),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [service, t],
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

  const listLabel = t('suppliers.list.totalHeader', {
    count: suppliers.length,
    more: hasMore ? '+' : '',
  });

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
      <StatusBar />

      <View style={[styles.headerBar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Button
          variant="ghost"
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>{t('suppliers.list.title')}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('suppliers.accessibility.newSupplier')}
          onPress={() => router.push("/suppliers/new")}
          disabled={permissionState !== 'authorized'}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Plus size={18} color={theme.primaryForeground} />
        </Pressable>
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.stateText, { color: theme.mutedForeground }]}>{t('suppliers.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('suppliers.unauthorized.title')} message={t('suppliers.unauthorized.description')} />
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
            tintColor={theme.primary}
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
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : suppliers.length === 0 ? (
          <View style={styles.centeredState}>
            <Text style={[styles.stateTitle, { color: theme.foreground }]}>{t('suppliers.empty.noSuppliers')}</Text>
            <Text style={[styles.stateText, { color: theme.mutedForeground }]}>{t('suppliers.empty.addSupplier')}</Text>
          </View>
        ) : (
          <>
            <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderColor: theme.border }]}>
              <Text style={[styles.headerCell, styles.headerInfo]}>
                {listLabel}
              </Text>
              <Text style={[styles.headerCell, styles.statusColumn]}>
                {t('suppliers.fields.status')}
              </Text>
              <View style={styles.headerChevronSpace} />
            </View>
            {suppliers.map((supplier) => {
              const detail = supplier.phoneNumber || supplier.email || "";
              return (
                <Pressable
                  key={supplier.id}
                  accessibilityRole="button"
                  accessibilityLabel={t('suppliers.accessibility.supplier', { name: supplier.supplierName })}
                  style={[styles.row, { borderBottomColor: theme.border, backgroundColor: theme.card }]}
                  onPress={() =>
                    router.push({
                      pathname: "/suppliers/view",
                      params: { id: supplier.id },
                    })
                  }
                >
                  <View style={[styles.logoWrapper, { backgroundColor: theme.muted }]}>
                    {supplier.logoUrl ? (
                      <Image
                        source={{ uri: supplier.logoUrl }}
                        style={styles.logoImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.logoPlaceholder, { backgroundColor: theme.secondary }]}>
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
                        { backgroundColor: theme.secondary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: supplier.isActive ? theme.chart2 : theme.destructive },
                        ]}
                      >
                        {supplier.isActive ? t('suppliers.status.active') : t('suppliers.status.inactive')}
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
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : null}
      </ScrollView>}
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
    borderBottomWidth: 1,
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
  scrollView: { flex: 1 },
  contentContainer: { paddingBottom: 24 },
  centeredState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 24,
  },
  stateTitle: { fontSize: 15, fontWeight: "700" },
  stateText: { fontSize: 13, textAlign: "center" },
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
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 6,
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
  },
  infoColumn: { flex: 1, minWidth: 0, gap: 4 },
  supplierName: { fontSize: 15, fontWeight: "700" },
  supplierDetail: { fontSize: 12 },
  statusColumn: { width: 84, alignItems: "flex-start" },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  loadMoreRow: { paddingVertical: 16, alignItems: "center" },
});
