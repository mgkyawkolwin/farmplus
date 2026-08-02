'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { ChevronLeft, Mail, MapPin, Pencil, Phone } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { container, DI_TOKENS } from '@/di';
import { ProductItem } from '@/models/product';
import { IProductService } from '@/services/productService';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';

const productService = container.resolve<IProductService>(DI_TOKENS.IProductService);

export default function ProductViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [product, setProduct] = React.useState<ProductItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!productId) {
      router.back();
      return;
    }

    let isActive = true;

    const loadProduct = async () => {
      setLoading(true);
      try {
        const result = await productService.getProductById(productId);
        if (isActive) {
          setProduct(result);
        }
      } catch (error) {
        if (isActive) {
          SnackBar.Error('Failed to load product details');
          router.back();
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [productId, router]);

  if (!product) {
    return null;
  }

  const detailRows = [
    {
      icon: Phone,
      label: 'Brand',
      value: product.brand || '-',
    },
    {
      icon: Mail,
      label: 'Category',
      value: product.category || '-',
    },
    {
      icon: MapPin,
      label: 'Unit',
      value: product.unit || '-',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar className="bg-background" barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'} />
      <LoadingOverlay isLoading={loading} />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          Product
        </Text>
        <Button variant="ghost" onPress={() => router.push({ pathname: '/products/edit', params: { id: product.id } })} style={styles.headerAction}>
          <Icon className="text-foreground" as={Pencil} size={18} />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileMain}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{product.name?.charAt(0) || 'P'}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text className="text-foreground" style={styles.productName}>
                {product.name}
              </Text>
              <Text className="text-muted-foreground" style={styles.productSince}>
                {product.description || 'No description provided'}
              </Text>
            </View>

            <Badge variant="default" style={styles.badge}>
              <Text>In Stock</Text>
            </Badge>
          </View>

          <View style={styles.detailsSection}>
            {detailRows.map((row, index) => (
              <View key={row.label} style={[styles.detailRow, index < detailRows.length - 1 ? styles.detailRowBorder : null]}>
                <View style={styles.detailIconWrap}>
                  <Icon className="text-foreground" as={row.icon} size={18} />
                </View>

                <View style={styles.detailTextWrap}>
                  <Text className="text-muted-foreground" style={styles.detailLabel}>{row.label}</Text>
                  <Text className="text-foreground" style={styles.detailValue}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text className="text-foreground" style={styles.statsTitle}>Inventory</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsColumn}>
              <Text className="text-muted-foreground" style={styles.statsLabel}>Purchase Price</Text>
              <Text className="text-foreground" style={styles.statsValue}>{product.purchasePrice != null ? `${product.purchasePrice} MMK` : '0 MMK'}</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsColumn}>
              <Text className="text-muted-foreground" style={styles.statsLabel}>Sale Price</Text>
              <Text className="text-foreground" style={styles.statsValue}>{product.salePrice != null ? `${product.salePrice} MMK` : '0 MMK'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text className="text-foreground" style={styles.statsTitle}>Stock</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsColumn}>
              <Text className="text-muted-foreground" style={styles.statsLabel}>Current Stock</Text>
              <Text className="text-foreground" style={styles.statsValue}>{product.currentStock ?? 0}</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsColumn}>
              <Text className="text-muted-foreground" style={styles.statsLabel}>Minimum Stock</Text>
              <Text className="text-foreground" style={styles.statsValue}>{product.minimumStock ?? 0}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 6 },
  backButton: { minWidth: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  headerAction: { minWidth: 40 },
  content: { padding: 16, gap: 16 },
  profileCard: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 16 },
  profileMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1 },
  productName: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  productSince: { fontSize: 13 },
  badge: { alignSelf: 'flex-start' },
  detailsSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  detailIconWrap: { width: 34, alignItems: 'center' },
  detailTextWrap: { flex: 1, marginLeft: 6 },
  detailLabel: { fontSize: 12, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600' },
  statsSection: { gap: 8 },
  statsTitle: { fontSize: 16, fontWeight: '700' },
  statsCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14 },
  statsColumn: { flex: 1, alignItems: 'center' },
  statsLabel: { fontSize: 12, marginBottom: 4 },
  statsValue: { fontSize: 15, fontWeight: '700' },
  statsDivider: { width: 1, height: 44, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
});
