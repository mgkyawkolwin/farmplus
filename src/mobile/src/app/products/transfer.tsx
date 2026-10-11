"use client";

import * as React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import DropdownModel, { DropdownModelItem } from "@/components/dropdownModel";
import SnackBar from "@/components/ui/snack-bar";
import { ShopServiceClient } from "@/services/shopService";
import { container, DI_TOKENS } from "@/di";
import { IProductService } from "@/services/productService";

const productService = container.resolve<IProductService>(
  DI_TOKENS.IProductService,
);

export default function TransferProductStockScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [shops, setShops] = React.useState<DropdownModelItem[]>([]);
  const [fromShopId, setFromShopId] = React.useState("");
  const [toShopId, setToShopId] = React.useState("");
  const [fromStock, setFromStock] = React.useState<number | null>(null);
  const [toStock, setToStock] = React.useState<number | null>(null);
  const [quantity, setQuantity] = React.useState("");
  const [remark, setRemark] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    new ShopServiceClient()
      .getShops(1, 100)
      .then((items) =>
        setShops(items.map((shop) => ({ label: shop.name, value: shop.id }))),
      )
      .catch(() => SnackBar.Error("Unable to load shops."));
  }, []);
  React.useEffect(() => {
    if (id && fromShopId)
      void productService
        .getShopStock(id, fromShopId)
        .then(setFromStock)
        .catch(() => SnackBar.Error("Unable to load source stock."));
  }, [id, fromShopId]);
  React.useEffect(() => {
    if (id && toShopId)
      void productService
        .getShopStock(id, toShopId)
        .then(setToStock)
        .catch(() => SnackBar.Error("Unable to load destination stock."));
  }, [id, toShopId]);

  const transfer = async () => {
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
        "Select different shops and enter a positive whole quantity.",
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
      SnackBar.Success("Stock transferred successfully.");
      router.back();
    } catch (error) {
      SnackBar.Error(
        error instanceof Error ? error.message : "Unable to transfer stock.",
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
          Transfer Stock
        </Text>
        <View style={styles.spacer} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.field}>
          <Label className="text-foreground">From Shop</Label>
          <DropdownModel
            items={shops}
            value={fromShopId}
            placeholder="Select source shop"
            title="Select Source Shop"
            onSelect={(item) => setFromShopId(item.value)}
          />
          {fromStock !== null && (
            <Text className="text-muted-foreground">
              Current stock: {fromStock}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Label className="text-foreground">To Shop</Label>
          <DropdownModel
            items={shops}
            value={toShopId}
            placeholder="Select destination shop"
            title="Select Destination Shop"
            onSelect={(item) => setToShopId(item.value)}
          />
          {toStock !== null && (
            <Text className="text-muted-foreground">
              Current stock: {toStock}
            </Text>
          )}
        </View>
        <View style={styles.field}>
          <Label className="text-foreground">Quantity</Label>
          <Input
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="number-pad"
            placeholder="0"
          />
        </View>
        <View style={styles.field}>
          <Label className="text-foreground">Remark</Label>
          <Input
            value={remark}
            onChangeText={setRemark}
            placeholder="Optional remark"
          />
        </View>
        <Button onPress={transfer} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-background">Transfer</Text>
          )}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 8 },
  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },
  spacer: { width: 40 },
  content: { padding: 16, gap: 16 },
  field: { gap: 8 },
});
