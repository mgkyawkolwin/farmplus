'use client';

import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
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
import { THEME } from '@/lib/theme';

const TONE_COLOR_KEYS = {
  blue: 'chart1',
  amber: 'chart4',
  green: 'chart2',
  slate: 'chart3',
} as const;

type Tone = keyof typeof TONE_COLOR_KEYS;
type ThemeColors = typeof THEME.light;

const getToneColors = (tone: Tone, theme: ThemeColors) => ({
  fg: theme[TONE_COLOR_KEYS[tone]],
  bg: theme.secondary,
  border: theme.border,
});

const COLUMNS = 4;
const GRID_GAP = 8;
const CONTENT_PADDING = 16;

const sections: { titleKey: string; tone: Tone; items: { labelKey: string; icon: typeof Users; path: string }[] }[] = [
    {
      titleKey: 'menu.sections.usersRolesPermissions',
      tone: 'blue',
      items: [
        { labelKey: 'menu.items.users', icon: Users, path: '/users/list' },
        { labelKey: 'menu.items.roles', icon: ShieldCheck, path: '/roles/list' },
        { labelKey: 'menu.items.rolePermissions', icon: UserCog, path: '/rolepermissions/rolepermissions' },
      ],
    },
    {
      titleKey: 'menu.sections.configuration',
      tone: 'amber',
      items: [
        { labelKey: 'menu.items.unit', icon: Boxes, path: '/units/units' },
        { labelKey: 'menu.items.category', icon: Boxes, path: '/categories/categories' },
        { labelKey: 'menu.items.brand', icon: Briefcase, path: '/brands/brands' },
        { labelKey: 'menu.items.shop', icon: Store, path: '/shops/shops' },
      ],
    },
    {
      titleKey: 'menu.sections.management',
      tone: 'green',
      items: [
        { labelKey: 'menu.items.customer', icon: Users, path: '/customers/dashboard' },
        { labelKey: 'menu.items.dealer', icon: Briefcase, path: '/dealers/dashboard' },
        { labelKey: 'menu.items.supplier', icon: Building, path: '/suppliers/dashboard' },
        { labelKey: 'menu.items.product', icon: Package, path: '/products/dashboard' },
        { labelKey: 'menu.items.inventory', icon: Warehouse, path: '/inventory/dashboard' },
        { labelKey: 'menu.items.sale', icon: ShoppingBag, path: '/sales/dashboard' },
        { labelKey: 'menu.items.purchase', icon: HandCoins, path: '/purchases/dashboard' },
      ],
    },
    {
      titleKey: 'menu.sections.reports',
      tone: 'slate',
      items: [
        { labelKey: 'menu.items.customer', icon: Users, path: '/reports/customers/dashboard' },
        { labelKey: 'menu.items.dealer', icon: Briefcase, path: '/reports/dealers/dashboard' },
        { labelKey: 'menu.items.supplier', icon: Building, path: '/reports/suppliers/dashboard' },
        { labelKey: 'menu.items.product', icon: Package, path: '/reports/products/dashboard' },
        { labelKey: 'menu.items.inventory', icon: Warehouse, path: '/reports/inventories/dashboard' },
        { labelKey: 'menu.items.sale', icon: ShoppingBag, path: '/reports/sales/dashboard' },
        { labelKey: 'menu.items.purchase', icon: HandCoins, path: '/reports/purchases/dashboard' },
      ],
    },
  ];

  const MenuItemCard = React.memo(
  ({
    item,
    label,
    tone,
    theme,
    width,
    onPress,
  }: {
    item: (typeof sections)[number]['items'][number];
    label: string;
    tone: Tone;
    theme: ThemeColors;
    width: number;
    onPress: (path: string) => void;
  }) => {
    const IconComponent = item.icon;
    const colors = getToneColors(tone, theme);
    return (
      <Pressable
        style={[styles.card, { width, backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => onPress(item.path)}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={[styles.iconChip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <IconComponent size={18} color={colors.fg} />
        </View>
        <Text style={[styles.cardLabel, { color: theme.cardForeground }]} numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
    );
  }
);

MenuItemCard.displayName = 'MenuItemCard';

export default function MenuScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
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
          {t('menu.title')}
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
          <View key={section.titleKey} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionAccent, { backgroundColor: getToneColors(section.tone, theme).fg }]} />
              <Text className="text-foreground" style={styles.sectionTitle} numberOfLines={1}>
                {t(section.titleKey)}
              </Text>
              <View style={[styles.sectionCount, { backgroundColor: getToneColors(section.tone, theme).bg }]}>
                <Text style={[styles.sectionCountText, { color: getToneColors(section.tone, theme).fg }]}>{section.items.length}</Text>
              </View>
            </View>

            <View style={styles.grid}>
              {section.items.map((item, index) => (
                <MenuItemCard
                  key={`${section.titleKey}-${item.labelKey}-${index}`}
                  item={item}
                  label={t(item.labelKey)}
                  tone={section.tone}
                  theme={theme}
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
    justifyContent: 'flex-start',
    borderRadius: 6,
    borderWidth: 1,
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
