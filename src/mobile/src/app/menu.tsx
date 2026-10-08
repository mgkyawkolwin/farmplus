'use client';

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
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

const TONES = {
  blue: { fg: '#2367A8', bg: '#EAF3FB', border: '#D6E6F3' },
  amber: { fg: '#9A6700', bg: '#FFF6E0', border: '#EFE2BF' },
  green: { fg: '#16794B', bg: '#E6F4EC', border: '#D5E9DC' },
  slate: { fg: '#475569', bg: '#EEF2F6', border: '#D9DEE5' },
} as const;

type Tone = keyof typeof TONES;

const COLUMNS = 4;
const GRID_GAP = 8;
const CONTENT_PADDING = 16;

const sections: { title: string; tone: Tone; items: { label: string; icon: typeof Users; path: string }[] }[] = [
    {
      title: 'Users, Roles & Permissions',
      tone: 'blue',
      items: [
        { label: 'Users', icon: Users, path: '/users/list' },
        { label: 'Roles', icon: ShieldCheck, path: '/roles/list' },
        { label: 'Role Permissions', icon: UserCog, path: '/settings' },
      ],
    },
    {
      title: 'Configuration',
      tone: 'amber',
      items: [
        { label: 'Unit', icon: Boxes, path: '/units/units' },
        { label: 'Category', icon: Boxes, path: '/categories/categories' },
        { label: 'Brand', icon: Briefcase, path: '/brands/brands' },
        { label: 'Shop', icon: Store, path: '/shops/shops' },
        { label: 'Account', icon: UserCog, path: '/settings' },
      ],
    },
    {
      title: 'Management',
      tone: 'green',
      items: [
        { label: 'Customer', icon: Users, path: '/customers/dashboard' },
        { label: 'Dealer', icon: Briefcase, path: '/dealers/dashboard' },
        { label: 'Supplier', icon: Building, path: '/suppliers/dashboard' },
        { label: 'Product', icon: Package, path: '/products/dashboard' },
        { label: 'Inventory', icon: Warehouse, path: '/inventory/dashboard' },
        { label: 'Sale', icon: ShoppingBag, path: '/sales/dashboard' },
        { label: 'Purchase', icon: HandCoins, path: '/purchases/dashboard' },
      ],
    },
    {
      title: 'Reports',
      tone: 'slate',
      items: [
        { label: 'Customer', icon: Users, path: '/customers/list' },
        { label: 'Dealer', icon: Briefcase, path: '/dealers/dashboard' },
        { label: 'Supplier', icon: Building, path: '/suppliers/dashboard' },
        { label: 'Product', icon: Package, path: '/products/dashboard' },
        { label: 'Inventory', icon: Warehouse, path: '/inventory/dashboard' },
        { label: 'Sale', icon: ShoppingBag, path: '/sales/dashboard' },
        { label: 'Purchase', icon: HandCoins, path: '/purchases/dashboard' },
      ],
    },
  ];

  const MenuItemCard = React.memo(
  ({
    item,
    tone,
    width,
    onPress,
  }: {
    item: (typeof sections)[number]['items'][number];
    tone: Tone;
    width: number;
    onPress: (path: string) => void;
  }) => {
    const IconComponent = item.icon;
    const colors = TONES[tone];
    return (
      <Pressable
        style={[styles.card, { width }]}
        onPress={() => onPress(item.path)}
        accessibilityRole="button"
        accessibilityLabel={item.label}
      >
        <View style={[styles.iconChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <IconComponent size={18} color={colors.fg} />
        </View>
        <Text className="text-foreground" style={styles.cardLabel} numberOfLines={2}>
          {item.label}
        </Text>
      </Pressable>
    );
  }
);

MenuItemCard.displayName = 'MenuItemCard';

export default function MenuScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor((screenWidth - CONTENT_PADDING * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS);

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
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: TONES[section.tone].fg }]} />
              <Text className="text-foreground" style={styles.sectionTitle} numberOfLines={1}>
                {section.title}
              </Text>
              <View style={[styles.sectionCount, { backgroundColor: TONES[section.tone].bg }]}>
                <Text style={[styles.sectionCountText, { color: TONES[section.tone].fg }]}>{section.items.length}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              {section.items.map((item, index) => (
                <MenuItemCard
                  key={`${section.title}-${item.label}-${index}`}
                  item={item}
                  tone={section.tone}
                  width={cardWidth}
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
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 14,
    paddingBottom: 28,
    gap: 22,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D9DEE5',
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionCount: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D9DEE5',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 6,
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
  },
});
