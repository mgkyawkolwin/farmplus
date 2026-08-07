'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { ChevronLeft, Phone, MapPin, Plus, Search } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { container, DI_TOKENS } from '@/di';
import { CustomerItem } from '@/models/customer';
import { ICustomerService } from '@/services/customerService';
import LoadingOverlay from '@/components/loadingOverlay';

const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);

export default function CustomerListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [customers, setCustomers] = React.useState<CustomerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [searchText, setSearchText] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const pageSize = 20;

  const loadCustomers = React.useCallback(async (nextPage = 1, reset = false, name?: string, isActiveFilter?: boolean) => {
    if (nextPage === 1 && !reset) {
      setLoading(true);
    }

    try {
      const result = await customerService.getCustomers(nextPage, pageSize, name, isActiveFilter);
      if (reset) {
        setCustomers(result);
      } else {
        setCustomers((prev) => [...prev, ...result]);
      }
      setHasMore(result.length === pageSize);
      setPage(nextPage);
    } catch (error) {
      if (reset) {
        setCustomers([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchCustomers = React.useCallback(async () => {
    setLoading(true);
    setCustomers([]);
    try {
      const result = await customerService.getCustomers(
        1,
        pageSize,
        searchText.trim(),
        activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
      );
      setCustomers(result);
      setHasMore(result.length === pageSize);
      setPage(1);
    } catch (error) {
      setCustomers([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, pageSize, searchText]);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useFocusEffect(
    React.useCallback(() => {
      fetchCustomers();
      return undefined;
    }, [fetchCustomers])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadCustomers(
      1,
      true,
      searchText.trim(),
      activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
    );
  }, [loadCustomers, searchText, activeFilter]);

  const onLoadMore = React.useCallback(() => {
    if (loadingMore || !hasMore || loading) {
      return;
    }

    setLoadingMore(true);
    loadCustomers(
      page + 1,
      false,
      searchText.trim(),
      activeFilter === 'active' ? true : activeFilter === 'inactive' ? false : undefined,
    );
  }, [loadingMore, hasMore, loading, loadCustomers, page, searchText, activeFilter]);

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <StatusBar
        className="bg-background"
        barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'}
      />
      <LoadingOverlay isLoading={loading} />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          Customers
        </Text>
        <Button variant="ghost" onPress={() => router.push('/customers/new')} style={styles.addButton}>
          <Icon className="text-foreground" as={Plus} size={20} />
        </Button>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon className="text-muted-foreground" as={Search} size={16} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search by customer name"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.filterRow}>
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'inactive', label: 'Inactive' },
          ].map((filter) => {
            const isSelected = activeFilter === filter.key;
            return (
              <Button
                key={filter.key}
                variant={isSelected ? 'default' : 'outline'}
                onPress={() => {
                  setActiveFilter(filter.key as 'all' | 'active' | 'inactive');
                }}
                style={isSelected ? styles.filterButtonActive : styles.filterButton}
              >
                <Text className={isSelected ? 'text-background' : 'text-foreground'} style={styles.filterButtonText}>
                  {filter.label}
                </Text>
              </Button>
            );
          })}
        </View>
      </View>

      {loading && customers.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-muted-foreground" style={styles.stateText}>
            Loading customers...
          </Text>
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>
            No customers found
          </Text>
          <Text className="text-muted-foreground" style={styles.stateText}>
            Add a customer to get started.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
            if (isNearBottom) {
              onLoadMore();
            }
          }}
        >
          {customers.map((customer) => (
            <Pressable
              key={customer.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/customers/view', params: { id: customer.id } })}
            >
              <View style={styles.leftSection}>
                <Text className="text-foreground" style={styles.customerName}>
                  {customer.name}
                </Text>
                <View style={styles.detailRow}>
                  <Icon className="text-muted-foreground" as={Phone} size={14} />
                  <Text className="text-muted-foreground" style={styles.customerDetail}>
                    {customer.phone ? customer.phone : '-'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon className="text-muted-foreground" as={MapPin} size={14} />
                  <Text className="text-muted-foreground" style={styles.customerDetail}>
                    {customer.address ? customer.address : '-'}
                  </Text>
                </View>
              </View>

              <View style={styles.rightSection}>
                <Text className="text-muted-foreground" style={styles.outstandingLabel}>
                  Outstanding
                </Text>
                <Text className="text-foreground" style={styles.outstandingValue}>
                  0 MMK
                </Text>
              </View>
            </Pressable>
          ))}

          {loadingMore ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#4f46e5" />
              <Text className="text-muted-foreground" style={styles.loadMoreText}>
                Loading more...
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    minWidth: 44,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    minWidth: 44,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 42,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filterButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
  },
  filterButtonActive: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    backgroundColor: '#111827',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  customerDetail: {
    fontSize: 13,
  },
  outstandingLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  outstandingValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadMoreText: {
    fontSize: 13,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  stateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
