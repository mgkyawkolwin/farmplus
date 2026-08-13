'use client';

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  BarChart3,
  Boxes,
  Briefcase,
  Building,
  FileText,
  HandCoins,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserCog,
  Users,
  Warehouse,
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ChevronLeft } from 'lucide-react-native';

const sections = [
    {
      title: 'Users, Roles & Permissions',
      items: [
        { label: 'Users', icon: Users, path: '/settings' },
        { label: 'Roles', icon: ShieldCheck, path: '/settings' },
        { label: 'Role Permissions', icon: UserCog, path: '/settings' },
      ],
    },
    {
      title: 'Configuration',
      items: [
        { label: 'Unit', icon: Boxes, path: '/units/units' },
        { label: 'Category', icon: Boxes, path: '/categories/categories' },
        { label: 'Brand', icon: Briefcase, path: '/brands/brands' },
        { label: 'Shop', icon: Store, path: '/settings' },
        { label: 'Account', icon: UserCog, path: '/settings' },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Customer', icon: Users, path: '/customers/list' },
        { label: 'Dealer', icon: Briefcase, path: '/dealers/dealers' },
        { label: 'Supplier', icon: Building, path: '/suppliers/suppliers' },
        { label: 'Product', icon: Package, path: '/products/list' },
        { label: 'Inventory', icon: Warehouse, path: '/settings' },
        { label: 'Sale', icon: ShoppingBag, path: '/settings' },
        { label: 'Purchase', icon: HandCoins, path: '/settings' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { label: 'Customer', icon: Users, path: '/customers/list' },
        { label: 'Dealer', icon: Briefcase, path: '/settings' },
        { label: 'Supplier', icon: Building, path: '/settings' },
        { label: 'Product', icon: Package, path: '/products/list' },
        { label: 'Inventory', icon: Warehouse, path: '/settings' },
        { label: 'Sale', icon: ShoppingBag, path: '/settings' },
        { label: 'Purchase', icon: HandCoins, path: '/settings' },
      ],
    },
  ];

  const MenuItemCard = React.memo(
  ({
    item,
    onPress,
  }: {
    item: (typeof sections)[number]['items'][number];
    onPress: (path: string) => void;
  }) => {
    const IconComponent = item.icon;
    return (
      <Pressable style={styles.card} onPress={() => onPress(item.path)}>
        <IconComponent size={24} className="text-foreground" />
        <Text className="text-foreground text-xs" style={styles.cardLabel}>
          {item.label}
        </Text>
      </Pressable>
    );
  }
);

MenuItemCard.displayName = 'MenuItemCard';

export default function MenuScreen() {
  const router = useRouter();

  const handlePress = React.useCallback(
    (path: string) => {
      router.replace(path as Parameters<typeof router.push>[0]);
    },
    [router]
  );

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          Menu
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 3. Use lightweight ScrollView instead of KeyboardAwareScrollView */}
      <ScrollView
        className="bg-background"
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text variant="h3" className="text-foreground" style={styles.sectionTitle}>
              {section.title}
            </Text>

            <View style={styles.grid}>
              {section.items.map((item, index) => (
                <MenuItemCard
                  key={`${section.title}-${item.label}-${index}`}
                  item={item}
                  onPress={handlePress}
                />
              ))}
            </View>
          </View>
        ))}
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
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '31%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  cardLabel: {
    textAlign: 'center',
    fontSize: 11,
  },
});
