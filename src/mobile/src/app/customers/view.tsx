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
import { ChevronLeft, CreditCard, Mail, MapPin, Pencil, Phone, Plus } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { container, DI_TOKENS } from '@/di';
import { CustomerItem } from '@/models/customer';
import { ICustomerService } from '@/services/customerService';
import LoadingOverlay from '@/components/loadingOverlay';
import SnackBar from '@/components/ui/snack-bar';

const customerService = container.resolve<ICustomerService>(DI_TOKENS.ICustomerService);

export default function CustomerViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const colorScheme = useColorScheme();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [customer, setCustomer] = React.useState<CustomerItem | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!customerId) {
      router.back();
      return;
    }

    let isActive = true;

    const loadCustomer = async () => {
      setLoading(true);
      try {
        const result = await customerService.getCustomerById(customerId);
        if (isActive) {
          setCustomer(result);
        }
      } catch (error) {
        if (isActive) {
          SnackBar.Error('Failed to load customer details');
          router.back();
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadCustomer();

    return () => {
      isActive = false;
    };
  }, [customerId, router]);

  if (!customer) {
    return null;
  }

  const createdAt = customer.createdAtUtc ? new Date(customer.createdAtUtc) : null;
  const createdAtText = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toISOString()
    : 'Unknown';

  const detailRows = [
    {
      icon: Phone,
      label: 'Phone',
      value: customer.phone || '-',
      action: () => {
        if (customer.phone) {
          SnackBar.Success('Phone action placeholder');
        }
      },
    },
    {
      icon: Mail,
      label: 'Email',
      value: customer.email || '-',
      action: () => {
        if (customer.email) {
          SnackBar.Success('Email action placeholder');
        }
      },
    },
    {
      icon: MapPin,
      label: 'Address',
      value: customer.address || '-',
      action: () => {
        if (customer.address) {
          SnackBar.Success('Address action placeholder');
        }
      },
    },
  ];

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
          Customer
        </Text>
        <Button variant="ghost" onPress={() => router.push({ pathname: '/customers/edit', params: { id: customer.id } })} style={styles.headerAction}>
          <Icon className="text-foreground" as={Pencil} size={18} />
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.profileMain}>
            <Avatar alt="Customer avatar" style={styles.avatar}>
              <AvatarImage source={{ uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${customer.id}` }} />
              <AvatarFallback>
                <Text style={styles.avatarFallbackText}>{customer.name?.charAt(0) || 'C'}</Text>
              </AvatarFallback>
            </Avatar>

            <View style={styles.profileInfo}>
              <Text className="text-foreground" style={styles.customerName}>
                {customer.name}
              </Text>
              <Text className="text-muted-foreground" style={styles.customerSince}>
                Customer since {createdAtText}
              </Text>
            </View>

            <Badge variant={customer.isActive ? 'default' : 'outline'} style={styles.badge}>
              <Text>{customer.isActive ? 'Active' : 'Inactive'}</Text>
            </Badge>
          </View>

          <View style={styles.detailsSection}>
            {detailRows.map((row, index) => (
              <View key={row.label} style={[styles.detailRow, index < detailRows.length - 1 ? styles.detailRowBorder : null]}>
                <View style={styles.detailIconWrap}>
                  <Icon className="text-foreground" as={row.icon} size={18} />
                </View>

                <View style={styles.detailTextWrap}>
                  <Text className="text-muted-foreground" style={styles.detailLabel}>
                    {row.label}
                  </Text>
                  <Text className="text-foreground" style={styles.detailValue}>
                    {row.value}
                  </Text>
                </View>

                <Pressable onPress={row.action} style={styles.detailAction}>
                  <Icon className="text-foreground" as={row.icon} size={16} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text className="text-foreground" style={styles.statsTitle}>
            Sales and Balance
          </Text>

          <View style={styles.statsCard}>
            <View style={styles.statsColumn}>
              <Text className="text-muted-foreground" style={styles.statsLabel}>
                Total Sales
              </Text>
              <Text className="text-foreground" style={styles.statsValue}>
                2,450,000 MMK
              </Text>
            </View>

            <View style={styles.statsDivider} />

            <View style={styles.statsColumn}>
              <Text className="text-muted-foreground" style={styles.statsLabel}>
                Outstanding
              </Text>
              <Text className="text-foreground" style={styles.statsValue}>
                120,000 MMK
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text className="text-foreground" style={styles.statsTitle}>
            Paid and Orders
          </Text>

          <View style={styles.statsCard}>
            <View style={styles.statsColumn}>
              <Text className="text-muted-foreground" style={styles.statsLabel}>
                Total Paid
              </Text>
              <Text className="text-foreground" style={styles.statsValue}>
                2,450,000 MMK
              </Text>
            </View>

            <View style={styles.statsDivider} />

            <View style={styles.statsColumn}>
              <Text className="text-muted-foreground" style={styles.statsLabel}>
                Total Orders
              </Text>
              <Text className="text-foreground" style={styles.statsValue}>
                35
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.actionButton}>
              <View style={styles.actionIconWrap}>
                <Icon className="text-foreground" as={Plus} size={18} />
              </View>
              <Text className="text-foreground" style={styles.actionLabel}>
                New Sale
              </Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <View style={styles.actionIconWrap}>
                <Icon className="text-foreground" as={CreditCard} size={18} />
              </View>
              <Text className="text-foreground" style={styles.actionLabel}>
                Payment
              </Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <View style={styles.actionIconWrap}>
                <Icon className="text-foreground" as={Pencil} size={18} />
              </View>
              <Text className="text-foreground" style={styles.actionLabel}  onPress={() => router.push({ pathname: '/customers/edit', params: { id: customer.id } })}>
                Edit
              </Text>
            </Pressable>

            <Pressable style={styles.actionButton}>
              <View style={styles.actionIconWrap}>
                <Icon className="text-foreground" as={Plus} size={18} />
              </View>
              <Text className="text-foreground" style={styles.actionLabel}>
                More
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  backButton: {
    minWidth: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  headerAction: {
    minWidth: 40,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  profileCard: {
  },
  profileMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallbackText: {
    fontSize: 20,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  customerSince: {
    fontSize: 13,
  },
  badge: {
    alignSelf: 'flex-start',
  },
  detailsSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailIconWrap: {
    width: 34,
    alignItems: 'center',
  },
  detailTextWrap: {
    flex: 1,
    marginLeft: 6,
  },
  detailLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailAction: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  statsSection: {
    gap: 8,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statsColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  statsDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 6,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
