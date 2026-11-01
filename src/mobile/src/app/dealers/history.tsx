'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { CustomerPayment } from '@/models/customer';
import { Sale } from '@/models/sale';
import { DealerServiceClient } from '@/services/dealerService';
import { usePagePermission } from '@/lib/usePagePermission';
import { THEME } from '@/lib/theme';
import { useTranslation } from 'react-i18next';

const dealerService = new DealerServiceClient();
const PAGE_SIZE = 20;

function formatMoney(value: number) {
  return `${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MMK`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '-'
    : date.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
}

export default function DealerHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/dealers/history');
  const params = useLocalSearchParams<{
    dealerId?: string | string[];
    kind?: string | string[];
  }>();
  const dealerId = Array.isArray(params.dealerId) ? params.dealerId[0] : params.dealerId;
  const kind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const showingPayments = kind === 'payments';
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [payments, setPayments] = React.useState<CustomerPayment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const itemCount = showingPayments ? payments.length : sales.length;

  const loadHistory = React.useCallback(async (nextPage = 1, append = false) => {
    if (!dealerId) {
      router.back();
      return;
    }

    try {
      if (showingPayments) {
        const result = await dealerService.getDealerPayments(dealerId, nextPage, PAGE_SIZE);
        setPayments((current) => (append ? [...current, ...result] : result));
        setHasMore(result.length === PAGE_SIZE);
      } else {
        const result = await dealerService.getDealerSales(dealerId, nextPage, PAGE_SIZE);
        setSales((current) => (append ? [...current, ...result] : result));
        setHasMore(result.length === PAGE_SIZE);
      }
      setPage(nextPage);
    } catch (error) {
      if (!append) {
        setSales([]);
        setPayments([]);
      }
      SnackBar.Error(error instanceof Error ? error.message : t('dealers.messages.unableLoadHistory'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [dealerId, router, showingPayments, t]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void loadHistory();
      return undefined;
    }, [loadHistory, permissionState]),
  );

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void loadHistory(page + 1, true);
  };

  const openSale = (saleId: string) =>
    router.push({ pathname: '/sales/view', params: { id: saleId } });

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && itemCount > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          {t(showingPayments ? 'dealers.history.paymentsTitle' : 'dealers.history.salesTitle')}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('dealers.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('dealers.unauthorized.title')} message={t('dealers.unauthorized.description')} />
      ) : loading && itemCount === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>
            {t(showingPayments ? 'dealers.history.loadingPayments' : 'dealers.history.loadingSales')}
          </Text>
        </View>
      ) : itemCount === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>
            {t(showingPayments ? 'dealers.empty.noPayments' : 'dealers.empty.noSales')}
          </Text>
          <Text className="text-muted-foreground" style={styles.stateText}>
            {t(showingPayments ? 'dealers.empty.noPaymentsDescription' : 'dealers.empty.noSalesDescription')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadHistory();
              }}
            />
          }
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) {
              loadMore();
            }
          }}
        >
          {showingPayments
            ? payments.map((payment) => (
                <Pressable key={payment.id} style={[styles.historyCard, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => openSale(payment.saleId)}>
                  <View style={styles.cardTopRow}>
                    <Text className="text-foreground" style={styles.cardTitle}>{t('dealers.history.payment')}</Text>
                    <Text className="text-muted-foreground" style={styles.cardDate}>{formatDate(payment.paidAt)}</Text>
                    <Icon className="text-muted-foreground" as={ChevronRight} size={16} />
                  </View>
                  <View style={[styles.amountRow, { borderTopColor: theme.border }]}>
                    <View>
                      <Text className="text-muted-foreground" style={styles.label}>{t('dealers.fields.amountPaid')}</Text>
                      <Text style={[styles.amount, { color: theme.chart2 }]}>{formatMoney(payment.amount)}</Text>
                    </View>
                    <View style={styles.amountRight}>
                      <Text className="text-muted-foreground" style={styles.label}>{t('dealers.fields.balanceAfter')}</Text>
                      <Text className="text-foreground" style={styles.amount}>{formatMoney(payment.balanceAfter)}</Text>
                    </View>
                  </View>
                </Pressable>
              ))
            : sales.map((sale) => (
                <Pressable key={sale.id} style={[styles.historyCard, { borderColor: theme.border, backgroundColor: theme.card }]} onPress={() => openSale(sale.id)}>
                  <View style={styles.cardTopRow}>
                    <Text className="text-foreground" style={styles.cardTitle}>
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text className="text-muted-foreground" style={styles.cardDate}>{formatDate(sale.saleDate)}</Text>
                    <Icon className="text-muted-foreground" as={ChevronRight} size={16} />
                  </View>
                  <View style={[styles.amountRow, { borderTopColor: theme.border }]}>
                    <View>
                      <Text className="text-muted-foreground" style={styles.label}>{t('dealers.fields.total')}</Text>
                      <Text className="text-foreground" style={styles.amount}>{formatMoney(sale.netTotal)}</Text>
                    </View>
                    <View style={styles.amountRight}>
                      <Text className="text-muted-foreground" style={styles.label}>{t('dealers.fields.balance')}</Text>
                      <Text style={[styles.amount, { color: sale.balance > 0 ? theme.chart4 : theme.chart2 }]}>
                        {formatMoney(sale.balance)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
          {loadingMore ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          {!hasMore ? <Text style={[styles.endNote, { color: theme.mutedForeground }]}>{t('dealers.history.endOfList')}</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  content: { padding: 12, gap: 10, paddingBottom: 24 },
  historyCard: { borderWidth: 1, borderRadius: 6, padding: 12, gap: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  cardDate: { fontSize: 12 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  amountRight: { alignItems: 'flex-end' },
  label: { fontSize: 11, marginBottom: 3 },
  amount: { fontSize: 14, fontWeight: '700' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
  endNote: { textAlign: 'center', fontSize: 11 },
});