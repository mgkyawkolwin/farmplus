"use client";

import * as React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useColorScheme } from 'nativewind';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import UnauthorizedView from "@/components/unauthorized-view";
import { Icon } from "@/components/ui/icon";
import DropdownModel, { DropdownModelItem } from "@/components/dropdownModel";
import SnackBar from "@/components/ui/snack-bar";
import { ShopServiceClient } from "@/services/shopService";
import { container, DI_TOKENS } from "@/di";
import { IProductService } from "@/services/productService";
import { usePagePermission } from "@/lib/usePagePermission";
import { THEME } from "@/lib/theme";
import { useTranslation } from 'react-i18next';

const productService = container.resolve<IProductService>(
  DI_TOKENS.IProductService,
);

export default function TransferProductStockScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const { id } = useLocalSearchParams<{ id?: string }>();
  const permissionState = usePagePermission('/products/transfer');
  const [shops, setShops] = React.useState<DropdownModelItem[]>([]);
  const [fromShopId, setFromShopId] = React.useState("");
  const [toShopId, setToShopId] = React.useState("");
  const [fromStock, setFromStock] = React.useState<number | null>(null);
  const [toStock, setToStock] = React.useState<number | null>(null);
  const [quantity, setQuantity] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (permissionState !== 'authorized') return undefined;
    new ShopServiceClient()
      .getShops(1, 100)
      .then((items) =>
        setShops(items.map((shop) => ({ label: shop.name, value: shop.id }))),
      )
        .catch(() => SnackBar.Error(t('products.messages.shopsFailed')));
      }, [permissionState, t]);
  React.useEffect(() => {
    if (permissionState === 'authorized' && id && fromShopId)
      void productService
        .getShopStock(id, fromShopId)
        .then(setFromStock)
          .catch(() => SnackBar.Error(t('products.messages.sourceStockFailed')));
        }, [id, fromShopId, permissionState, t]);
  React.useEffect(() => {
    if (permissionState === 'authorized' && id && toShopId)
      void productService
        .getShopStock(id, toShopId)
        .then(setToStock)
          .catch(() => SnackBar.Error(t('products.messages.destinationStockFailed')));
        }, [id, toShopId, permissionState, t]);

  const transfer = async () => {
    if (permissionState !== 'authorized') return;
    const amount = Number(quantity);
    if (
      !id ||
      !fromShopId ||
      !toShopId ||
      fromShopId === toShopId ||
      !Number.isInteger(amount) ||
      amount <= 0
    ) {
      SnackBar.Error(
        t('products.messages.transferInvalid'),
      );
      return;
    }
    setSaving(true);
    try {
      await productService.transferStock(id, {
        fromShopId,
        toShopId,
        quantity: amount,
        remark: remark.trim() || undefined,
      });
      SnackBar.Success(t('products.messages.transferSuccess'));
      router.back();
    } catch (error) {
      SnackBar.Error(
        error instanceof Error ? error.message : t('products.messages.transferFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <View style={styles.header}>
        <Button variant="ghost" onPress={() => router.back()}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.title}>
          {t('products.transfer.title')}
        </Text>
        <View style={styles.spacer} />
      </View>
      {permissionState === 'checking' ? (
        <View style={styles.permissionState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground">{t('products.dashboard.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView title={t('products.unauthorized.title')} message={t('products.unauthorized.description')} />
      ) : <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Label className="text-foreground">{t('products.transfer.fromShop')}</Label>
          <DropdownModel
            items={shops}
            value={fromShopId}
            placeholder={t('products.placeholders.sourceShop')}
            title={t('products.transfer.selectSourceShop')}
            onSelect={(item) => setFromShopId(item.value)}
          />
          {fromStock !== null && (
            <Text className="text-muted-foreground">
              {t('products.transfer.currentStock', { count: fromStock })}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Label className="text-foreground">{t('products.transfer.toShop')}</Label>
          <DropdownModel
            items={shops}
            value={toShopId}
            placeholder={t('products.placeholders.destinationShop')}
            title={t('products.transfer.selectDestinationShop')}
            onSelect={(item) => setToShopId(item.value)}
          />
          {toStock !== null && (
            <Text className="text-muted-foreground">
              {t('products.transfer.currentStock', { count: toStock })}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Label className="text-foreground">{t('products.transfer.quantity')}</Label>
          <Input
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            placeholder="0"
          />
        </View>
        <View style={styles.field}>
          <Label className="text-foreground">{t('products.transfer.remark')}</Label>
          <Input
            value={remark}
            onChangeText={setRemark}
            placeholder={t('products.placeholders.optionalRemark')}
          />
        </View>
        <Button onPress={transfer} disabled={saving} style={{ backgroundColor: theme.primary }}>
          {saving ? (
            <ActivityIndicator color={theme.primaryForeground} />
          ) : (
            <Text style={{ color: theme.primaryForeground }}>{t('products.actions.transfer')}</Text>
          )}
        </Button>
      </ScrollView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  permissionState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  spacer: { width: 40 },
  content: { padding: 16, gap: 16 },
  field: { gap: 8 },
});
