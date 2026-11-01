'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { ThemedStatusBar as StatusBar } from "@/components/themed-status-bar";
import {
  ChevronLeft,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShoppingCart,
} from 'lucide-react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
import { DealerItem } from '@/models/dealer';
import { DealerServiceClient } from '@/services/dealerService';
import SnackBar from '@/components/ui/snack-bar';
import { usePagePermission } from '@/lib/usePagePermission';
import { THEME } from '@/lib/theme';

export default function DealerViewScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const permissionState = usePagePermission('/dealers/view');
  const dealerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const service = React.useMemo(() => new DealerServiceClient(), []);
  const [dealer, setDealer] = React.useState<DealerItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadDealer = React.useCallback(async () => {
    if (!dealerId) {
      router.back();
      return;
    }

    setLoading(true);
    try {
      const result = await service.getDealerById(dealerId);
      setDealer(result);
    } catch (error) {
      SnackBar.Error('Failed to load dealer details.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [dealerId, router, service]);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      void loadDealer();
      return undefined;
    }, [loadDealer, permissionState]),
  );

  if (permissionState !== 'authorized' || !dealer) {
    return (
      <SafeAreaView style={[styles.page, { backgroundColor: theme.background }]}>
        <View style={styles.headerBar}>
          <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
            <Icon className="text-foreground" as={ChevronLeft} size={22} />
          </Button>
          <Text style={[styles.headerTitle, { color: theme.foreground }]}>Dealer</Text>
          <View style={styles.headerButton} />
        </View>
        {permissionState === 'denied' ? <UnauthorizedView /> : (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text className="text-muted-foreground" style={styles.loadingText}>
              {permissionState === 'checking' ? 'Checking permission...' : 'Loading dealer...'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  const location = [
    dealer.address,
    dealer.city,
    dealer.stateDivision,
    dealer.country,
  ]
    .filter(Boolean)
    .join(', ');

  const detailRows = [
    { icon: Phone, label: 'Phone', value: dealer.phoneNumber || '-' },
    { icon: Mail, label: 'Email', value: dealer.email || '-' },
    { icon: MapPin, label: 'Address', value: location || '-' },
    { icon: Globe, label: 'Country', value: dealer.country || '-' },
  ];

  const initial = dealer.dealerName?.charAt(0).toUpperCase() || 'D';
  const subtitle =
    [dealer.city, dealer.country].filter(Boolean).join(', ') || 'Dealer';
  const recentSales = dealer.recentSales ?? [];
  const recentPayments = dealer.recentPayments ?? [];
  const formatMoney = (amount: number | undefined) =>
    `${(amount ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} MMK`;
  const owesBalance = (dealer.totalOutstanding ?? 0) > 0;

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
        <Text style={[styles.headerTitle, { color: theme.foreground }]}>Dealer</Text>
        <Button
          variant="ghost"
          onPress={() =>
            router.push({
              pathname: '/dealers/edit',
              params: { id: dealer.id },
            })
          }
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Pencil} size={18} />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.profilePanel, { backgroundColor: theme.card, borderColor: theme.border, borderTopColor: theme.primary }]}>
          <View style={[styles.logoWrap, { backgroundColor: theme.secondary }]}>
            {dealer.logoUrl ? (
              <Image
                source={{ uri: dealer.logoUrl }}
                style={styles.logoImage}
              />
            ) : (
              <Text style={[styles.logoInitial, { color: theme.primary }]}>{initial}</Text>
            )}
          </View>

          <View style={styles.profileInfo}>
            <Text style={[styles.dealerName, { color: theme.foreground }]} numberOfLines={1}>
              {dealer.dealerName}
            </Text>
            <Text style={[styles.dealerMeta, { color: theme.mutedForeground }]} numberOfLines={1}>
              {subtitle}
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
                  { color: dealer.isActive ? theme.chart2 : theme.destructive },
                ]}
              >
                {dealer.isActive ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </View>
          </View>
        </View>

        <Button
          style={{ backgroundColor: theme.primary }}
          onPress={() =>
            router.push({
              pathname: '/dealers/sales' as '/dealers/view',
              params: { dealerId: dealer.id },
            })
          }
          disabled={!dealer.isActive}
        >
          <Icon as={ShoppingCart} size={16} color={theme.primaryForeground} />
          <Text className="font-semibold" style={{ color: theme.primaryForeground }}>Sale</Text>
        </Button>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Contact & Location</Text>
        <View style={[styles.panel, { borderColor: theme.border, backgroundColor: theme.card }]}>
          {detailRows.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.detailRow,
                index < detailRows.length - 1 ? [styles.rowDivider, { borderBottomColor: theme.border }] : null,
              ]}
            >
              <View style={[styles.detailIconWrap, { backgroundColor: theme.muted }]}>
                <Icon
                  className="text-muted-foreground"
                  as={row.icon}
                  size={16}
                />
              </View>
              <View style={styles.detailText}>
                <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.fieldValue, { color: theme.foreground }]} numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Summary</Text>
        <View style={styles.kpiGrid}>
          <KpiTile
            label="Total Sales"
            value={formatMoney(dealer.totalSales)}
            accent={{ borderTopColor: theme.chart1, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <KpiTile
            label="Total Orders"
            value={(dealer.totalOrders ?? 0).toLocaleString('en-US')}
            accent={{ borderTopColor: theme.mutedForeground, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <KpiTile
            label="Total Paid"
            value={formatMoney(dealer.totalPaid)}
            accent={{ borderTopColor: theme.chart2, backgroundColor: theme.secondary }}
            theme={theme}
          />
          <KpiTile
            label="Outstanding"
            value={formatMoney(dealer.totalOutstanding)}
            accent={{ borderTopColor: owesBalance ? theme.chart4 : theme.chart2, backgroundColor: theme.secondary }}
            valueStyle={owesBalance ? { color: theme.chart4 } : undefined}
            theme={theme}
          />
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Recent Sales</Text>
          <Button
            variant="ghost"
            style={styles.viewAllButton}
            onPress={() =>
              router.push({
                pathname: '/dealers/history',
                params: { dealerId: dealer.id, kind: 'sales' },
              } as Parameters<typeof router.push>[0])
            }
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View all</Text>
            <Icon as={ChevronRight} size={14} color={theme.primary} />
          </Button>
        </View>
        <View style={[styles.table, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderBottomColor: theme.border }]}>
            <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Total</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Balance</Text>
          </View>
          {recentSales.map((sale) => (
            <Pressable
              key={sale.id}
              accessibilityRole="button"
              style={[styles.tableRow, { borderBottomColor: theme.border }]}
              onPress={() =>
                router.push({ pathname: '/sales/view', params: { id: sale.id } })
              }
            >
              <Text style={[styles.cell, styles.dateCol, { color: theme.foreground }]}>
                {new Date(sale.saleDate).toLocaleDateString()}
              </Text>
              <Text style={[styles.cell, styles.amountCol, { color: theme.foreground }]}>
                {formatMoney(sale.netTotal)}
              </Text>
              <Text
                style={[
                  styles.cell,
                  styles.amountCol,
                  sale.balance > 0 ? { color: theme.chart4, fontWeight: '700' } : { color: theme.foreground },
                ]}
              >
                {formatMoney(sale.balance)}
              </Text>
            </Pressable>
          ))}
          {recentSales.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>No sales recorded.</Text>
          ) : null}
        </View>

        <View style={styles.sectionHeadingRow}>
          <Text style={[styles.sectionHeading, { color: theme.mutedForeground }]}>Recent Payments</Text>
          <Button
            variant="ghost"
            style={styles.viewAllButton}
            onPress={() =>
              router.push({
                pathname: '/dealers/history',
                params: { dealerId: dealer.id, kind: 'payments' },
              } as Parameters<typeof router.push>[0])
            }
          >
            <Text style={[styles.viewAllText, { color: theme.primary }]}>View all</Text>
            <Icon as={ChevronRight} size={14} color={theme.primary} />
          </Button>
        </View>
        <View style={[styles.table, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <View style={[styles.tableHeader, { backgroundColor: theme.muted, borderBottomColor: theme.border }]}>
            <Text style={[styles.headerCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Amount</Text>
            <Text style={[styles.headerCell, styles.amountCol]}>Balance After</Text>
          </View>
          {recentPayments.map((payment) => (
            <Pressable
              key={payment.id}
              accessibilityRole="button"
              style={[styles.tableRow, { borderBottomColor: theme.border }]}
              onPress={() =>
                router.push({
                  pathname: '/sales/view',
                  params: { id: payment.saleId },
                })
              }
            >
              <Text style={[styles.cell, styles.dateCol, { color: theme.foreground }]}>
                {new Date(payment.paidAt).toLocaleDateString()}
              </Text>
              <Text style={[styles.cell, styles.amountCol, { color: theme.foreground }]}>
                {formatMoney(payment.amount)}
              </Text>
              <Text style={[styles.cell, styles.amountCol, { color: theme.foreground }]}>
                {formatMoney(payment.balanceAfter)}
              </Text>
            </Pressable>
          ))}
          {recentPayments.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.mutedForeground }]}>No payments recorded.</Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type KpiTileProps = {
  label: string;
  value: string;
  accent: StyleProp<ViewStyle>;
  theme: typeof THEME.light;
  valueStyle?: StyleProp<TextStyle>;
};

function KpiTile({ label, value, accent, theme, valueStyle }: KpiTileProps) {
  return (
    <View style={[styles.kpiTile, accent]}>
      <Text style={[styles.fieldLabel, { color: theme.mutedForeground }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: theme.foreground }, valueStyle]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  headerButton: { minWidth: 40 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 13 },
  profilePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderTopWidth: 3,
    borderRadius: 6,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: { width: '100%', height: '100%' },
  logoInitial: { fontSize: 22, fontWeight: '800' },
  profileInfo: { flex: 1, minWidth: 0, gap: 3 },
  dealerName: { fontSize: 18, fontWeight: '800' },
  dealerMeta: { fontSize: 12 },
  statusPill: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAllButton: {
    minHeight: 32,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: { fontSize: 12, fontWeight: '700' },
  panel: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: { flex: 1, minWidth: 0, gap: 2 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  fieldValue: { fontSize: 14, fontWeight: '600' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiTile: {
    width: '48%',
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderTopWidth: 3,
    borderRadius: 6,
  },
  kpiValue: { fontSize: 15, fontWeight: '800' },
  table: {
    borderWidth: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  headerCell: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: { fontSize: 12 },
  cellAmber: { fontWeight: '700' },
  dateCol: { flex: 1.2 },
  amountCol: { flex: 1, textAlign: 'right' },
  emptyText: {
    padding: 14,
    textAlign: 'center',
    fontSize: 12,
  },
});
