'use client';

import * as React from 'react';
import { Pressable, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
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

export default function MenuScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();

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
        { label: 'Category', icon: Boxes, path: '/categories/categories' },
        { label: 'Brand', icon: Briefcase, path: '/settings' },
        { label: 'Shop', icon: Store, path: '/settings' },
        { label: 'Account', icon: UserCog, path: '/settings' },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Customer', icon: Users, path: '/settings' },
        { label: 'Dealer', icon: Briefcase, path: '/settings' },
        { label: 'Supplier', icon: Building, path: '/settings' },
        { label: 'Product', icon: Package, path: '/settings' },
        { label: 'Inventory', icon: Warehouse, path: '/settings' },
        { label: 'Sale', icon: ShoppingBag, path: '/settings' },
        { label: 'Purchase', icon: HandCoins, path: '/settings' },
      ],
    },
    {
      title: 'Reports',
      items: [
        { label: 'Customer', icon: Users, path: '/settings' },
        { label: 'Dealer', icon: Briefcase, path: '/settings' },
        { label: 'Supplier', icon: Building, path: '/settings' },
        { label: 'Product', icon: Package, path: '/settings' },
        { label: 'Inventory', icon: Warehouse, path: '/settings' },
        { label: 'Sale', icon: ShoppingBag, path: '/settings' },
        { label: 'Purchase', icon: HandCoins, path: '/settings' },
      ],
    },
  ];

  return (
    <SafeAreaView className="bg-background" style={styles.page}>
      <StatusBar className="bg-background" barStyle={colorScheme === 'light' ? 'light-content' : 'dark-content'} />

      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.backButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>
          Menu
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
        className="bg-background"
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text variant="h3" className="text-foreground" style={styles.sectionTitle}>
              {section.title}
            </Text>

            <View style={styles.grid}>
              {section.items.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Pressable
                    key={`${section.title}-${item.label}-${index}`}
                    style={styles.card}
                    onPress={() => router.replace((item.path ?? '/settings') as Parameters<typeof router.push>[0])}
                  >
                    <IconComponent size={24} className="text-foreground" />
                    <Text className="text-foreground text-xs" style={styles.cardLabel}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </KeyboardAwareScrollView>
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
