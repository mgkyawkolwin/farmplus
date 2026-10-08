import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { AlertTriangle, Store } from 'lucide-react-native';

import { Text } from '@/components/ui/text';

interface ShopBannerProps {
  label?: string;
  name?: string | null;
  emptyText?: string;
}

/** Compact strip showing which shop the current screen is scoped to. */
export default function ShopBanner({ label = 'Shop', name, emptyText }: ShopBannerProps) {
  const missing = !name && !!emptyText;

  return (
    <View style={[styles.banner, missing && styles.bannerWarn]}>
      <View style={[styles.icon, missing && styles.iconWarn]}>
        {missing ? <AlertTriangle size={14} color="#B45309" /> : <Store size={14} color="#16794B" />}
      </View>
      <View style={styles.info}>
        <Text style={styles.eyebrow}>{label}</Text>
        {missing ? (
          <Text style={styles.warnText}>{emptyText}</Text>
        ) : (
          <Text style={styles.name} numberOfLines={1}>{name || '-'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#D5E9DC',
    borderRadius: 8,
    backgroundColor: '#F4FAF6',
  },
  bannerWarn: { borderColor: '#EFE2BF', backgroundColor: '#FFFAEE' },
  icon: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F4EC' },
  iconWarn: { backgroundColor: '#FFF1CC' },
  info: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 9, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 },
  name: { fontSize: 13, fontWeight: '800', color: '#0F172A', lineHeight: 16 },
  warnText: { fontSize: 11, fontWeight: '600', color: '#92400E', lineHeight: 14 },
});
