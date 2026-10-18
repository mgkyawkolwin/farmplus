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

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';
import { CustomerPayment } from '@/models/customer';
import { Sale } from '@/models/sale';
import { DealerServiceClient } from '@/services/dealerService';

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
      SnackBar.Error(
        error instanceof Error
          ? error.message
          : `Unable to load dealer ${showingPayments ? 'payments' : 'sales'}`,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [dealerId, router, showingPayments]);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      void loadHistory();
      return undefined;
    }, [loadHistory]),
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
          Dealer {showingPayments ? 'Payments' : 'Sales'}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {loading && itemCount === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>
            Loading {showingPayments ? 'payments' : 'sales'}...
          </Text>
        </View>
      ) : itemCount === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>
            No {showingPayments ? 'payments' : 'sales'} found
          </Text>
          <Text className="text-muted-foreground" style={styles.stateText}>
            This dealer has no recorded {showingPayments ? 'payments' : 'sales'}.
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
                <Pressable key={payment.id} style={styles.historyCard} onPress={() => openSale(payment.saleId)}>
                  <View style={styles.cardTopRow}>
                    <Text className="text-foreground" style={styles.cardTitle}>Payment</Text>
                    <Text className="text-muted-foreground" style={styles.cardDate}>{formatDate(payment.paidAt)}</Text>
                    <Icon className="text-muted-foreground" as={ChevronRight} size={16} />
                  </View>
                  <View style={styles.amountRow}>
                    <View>
                      <Text className="text-muted-foreground" style={styles.label}>Amount Paid</Text>
                      <Text style={[styles.amount, styles.paymentAmount]}>{formatMoney(payment.amount)}</Text>
                    </View>
                    <View style={styles.amountRight}>
                      <Text className="text-muted-foreground" style={styles.label}>Balance After</Text>
                      <Text className="text-foreground" style={styles.amount}>{formatMoney(payment.balanceAfter)}</Text>
                    </View>
                  </View>
                </Pressable>
              ))
            : sales.map((sale) => (
                <Pressable key={sale.id} style={styles.historyCard} onPress={() => openSale(sale.id)}>
                  <View style={styles.cardTopRow}>
                    <Text className="text-foreground" style={styles.cardTitle}>
                      #{sale.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text className="text-muted-foreground" style={styles.cardDate}>{formatDate(sale.saleDate)}</Text>
                    <Icon className="text-muted-foreground" as={ChevronRight} size={16} />
                  </View>
                  <View style={styles.amountRow}>
                    <View>
                      <Text className="text-muted-foreground" style={styles.label}>Total</Text>
                      <Text className="text-foreground" style={styles.amount}>{formatMoney(sale.netTotal)}</Text>
                    </View>
                    <View style={styles.amountRight}>
                      <Text className="text-muted-foreground" style={styles.label}>Balance</Text>
                      <Text style={[styles.amount, { color: sale.balance > 0 ? '#B45309' : '#047857' }]}>
                        {formatMoney(sale.balance)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
          {loadingMore ? <ActivityIndicator size="small" color="#16794B" /> : null}
          {!hasMore ? <Text style={styles.endNote}>End of list</Text> : null}
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
  historyCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, backgroundColor: '#FFFFFF', padding: 12, gap: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  cardDate: { fontSize: 12 },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0', paddingTop: 10 },
  amountRight: { alignItems: 'flex-end' },
  label: { fontSize: 11, marginBottom: 3 },
  amount: { fontSize: 14, fontWeight: '700' },
  paymentAmount: { color: '#047857' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
  endNote: { textAlign: 'center', color: '#64748B', fontSize: 11 },
});