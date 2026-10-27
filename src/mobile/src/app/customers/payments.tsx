"use client";

import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import LoadingOverlay from "@/components/loadingOverlay";
import SnackBar from "@/components/ui/snack-bar";
import { container, DI_TOKENS } from "@/di";
import { CustomerPayment } from "@/models/customer";
import { ICustomerService } from "@/services/customerService";
import { usePagePermission } from "@/lib/usePagePermission";

const customerService = container.resolve<ICustomerService>(
  DI_TOKENS.ICustomerService,
);
const PAGE_SIZE = 20;

function formatMoney(value: number) {
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MMK`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

export default function CustomerPaymentsScreen() {
  const router = useRouter();
  const permissionState = usePagePermission('/customers/payments');
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const [payments, setPayments] = React.useState<CustomerPayment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const loadPayments = React.useCallback(
    async (nextPage = 1, append = false) => {
      if (!customerId) {
        router.back();
        return;
      }

      try {
        const result = await customerService.getCustomerPayments(
          customerId,
          nextPage,
          PAGE_SIZE,
        );
        setPayments((current) => (append ? [...current, ...result] : result));
        setPage(nextPage);
        setHasMore(result.length === PAGE_SIZE);
      } catch (error) {
        if (!append) setPayments([]);
        SnackBar.Error(
          error instanceof Error
            ? error.message
            : "Unable to load customer payments",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [customerId, router],
  );

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      void loadPayments();
      return undefined;
    }, [loadPayments, permissionState]),
  );

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    void loadPayments(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && payments.length > 0} />
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
          Customer Payments
        </Text>
        <View style={styles.headerButton} />
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>Checking permission...</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : loading && payments.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#16794B" />
          <Text className="text-muted-foreground" style={styles.stateText}>
            Loading payments...
          </Text>
        </View>
      ) : payments.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>
            No payments found
          </Text>
          <Text className="text-muted-foreground" style={styles.stateText}>
            This customer has no recorded payments.
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
                void loadPayments();
              }}
            />
          }
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } =
              event.nativeEvent;
            if (
              layoutMeasurement.height + contentOffset.y >=
              contentSize.height - 120
            ) {
              loadMore();
            }
          }}
        >
          {payments.map((payment) => (
            <Pressable
              key={payment.id}
              style={styles.paymentCard}
              onPress={() =>
                router.push({
                  pathname: "/sales/view",
                  params: { id: payment.saleId },
                })
              }
            >
              <View style={styles.paymentTopRow}>
                <Text className="text-foreground" style={styles.paymentDate}>
                  {formatDate(payment.paidAt)}
                </Text>
                <Icon
                  className="text-muted-foreground"
                  as={ChevronRight}
                  size={16}
                />
              </View>
              <View style={styles.amountRow}>
                <View>
                  <Text className="text-muted-foreground" style={styles.label}>
                    Amount Paid
                  </Text>
                  <Text style={[styles.amount, styles.paymentAmount]}>
                    {formatMoney(payment.amount)}
                  </Text>
                </View>
                <View style={styles.amountRight}>
                  <Text className="text-muted-foreground" style={styles.label}>
                    Balance After
                  </Text>
                  <Text className="text-foreground" style={styles.amount}>
                    {formatMoney(payment.balanceAfter)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
          {loadingMore ? (
            <ActivityIndicator size="small" color="#16794B" />
          ) : null}
          {!hasMore ? <Text style={styles.endNote}>End of list</Text> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
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
  content: { padding: 12, gap: 10, paddingBottom: 24 },
  paymentCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 12,
  },
  paymentTopRow: { flexDirection: "row", alignItems: "center" },
  paymentDate: { flex: 1, fontSize: 14, fontWeight: "700" },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    paddingTop: 10,
  },
  amountRight: { alignItems: "flex-end" },
  label: { fontSize: 11, marginBottom: 3 },
  amount: { fontSize: 14, fontWeight: "700" },
  paymentAmount: { color: "#047857" },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  stateTitle: { fontSize: 17, fontWeight: "600" },
  stateText: { marginTop: 8, textAlign: "center" },
  endNote: { textAlign: "center", color: "#64748B", fontSize: 11 },
});
