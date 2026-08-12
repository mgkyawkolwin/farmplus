'use client';

import * as React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { useRouter } from 'expo-router';
import { ChevronRight, Boxes, CircleAlert, CircleCheckBig, Package, PackageX, Plus, Search, ShoppingBag, Sparkles, Store, TriangleAlert, UserPlus } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import HomeTopBar from '@/components/homeTopBar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Rice Seed 25kg', category: 'Seeds', stock: 120 },
  { id: 2, name: 'Organic Fertilizer', category: 'Fertilizer', stock: 18 },
  { id: 3, name: 'Pesticide Spray', category: 'Chemicals', stock: 5 },
  { id: 4, name: 'Drip Pipe 100m', category: 'Irrigation', stock: 0 },
];

export default function ProductsScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };

  const metrics = [
    { label: 'Total Products', value: '124' },
    { label: 'Categories', value: '18' },
    { label: 'Active Products', value: '108' },
    { label: 'Inactive Products', value: '16' },
    { label: 'Low Stock', value: '7' },
    { label: 'Out of Stock', value: '3' },
  ];

  const quickActions = [
    { label: 'New Product', icon: Plus, route: '/products/new' as const },
    { label: 'Products', icon: Package, route: '/products/list' as const },
    { label: 'Categories', icon: Boxes, route: '/products/list' as const },
    { label: 'Low Stock', icon: TriangleAlert, route: '/products/list' as const },
    { label: 'Out of Stock', icon: PackageX, route: '/products/list' as const },
    { label: 'Inventory', icon: Store, route: '/products/list' as const },
  ];

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <HomeTopBar />
      <KeyboardAwareScrollView className="bg-background" style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text variant="h3" className="text-foreground">Overview</Text>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <Card key={index} style={styles.metricCard}>
              <Text className="text-muted-foreground text-sm" style={styles.metricLabel}>
                {metric.label}
              </Text>
              <Text variant="h4" className="text-foreground" style={styles.metricValue}>
                {metric.value}
              </Text>
            </Card>
          ))}
        </View>

        <View style={styles.quickActionsContainer}>
          <Text variant="h3" className="text-foreground" style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Pressable key={index} style={styles.actionButton} onPress={() => router.push(action.route)}>
                  <IconComponent size={28} className="text-foreground" />
                  <Text className="text-foreground text-xs" style={styles.actionLabel}>{action.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text variant="h4" className="text-foreground">Recent Products</Text>
            <Pressable onPress={() => router.push('/products/list')}>
              <ChevronRight size={18} color="#4f46e5" />
            </Pressable>
          </View>

          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, { flex: 2 }]} className="text-muted-foreground text-xs font-semibold">Product</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.4 }]} className="text-muted-foreground text-xs font-semibold">Category</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]} className="text-muted-foreground text-xs font-semibold text-right">Stock</Text>
          </View>

          {SAMPLE_PRODUCTS.map((product) => (
            <Pressable key={product.id} style={styles.tableRow} onPress={() => router.push({ pathname: '/products/view', params: { id: product.id } })}>
              <View style={[styles.tableCell, { flex: 2 }]}> 
                <Text className="text-foreground text-sm font-medium">{product.name}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1.4 }]}> 
                <Text className="text-muted-foreground text-sm">{product.category}</Text>
              </View>
              <View style={[styles.tableCell, { flex: 1, alignItems: 'flex-end' }]}> 
                <Text className={product.stock === 0 ? 'text-red-500' : 'text-foreground'} style={styles.stockText}>
                  {product.stock}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingVertical: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '48%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickActionsContainer: {
    marginTop: 16,
    gap: 10,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    gap: 6,
  },
  actionLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  tableCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 6,
  },
  tableHeaderCell: {
    fontSize: 11,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    justifyContent: 'center',
  },
  stockText: {
    fontSize: 13,
    fontWeight: '600',
  },
});