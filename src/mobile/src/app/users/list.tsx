'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Mail, MapPin, Phone, Plus, UserRound } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import UnauthorizedView from '@/components/unauthorized-view';
import SnackBar from '@/components/ui/snack-bar';
import { usePagePermission } from '@/lib/usePagePermission';
import { container, DI_TOKENS } from '@/di';
import User from '@/models/user';
import { IUserService } from '@/services/userService';
import LoadingOverlay from '@/components/loadingOverlay';
import { THEME } from '@/lib/theme';

const userService = container.resolve<IUserService>(DI_TOKENS.IUserService);
const PAGE_SIZE = 20;

export default function UserListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/users/list');
  const [users, setUsers] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const fetchUsers = React.useCallback(async (nextPage = 1, append = false) => {
    try {
      const result = await userService.getUsers(nextPage, PAGE_SIZE);
      setUsers((current) => append ? [...current, ...result] : result);
      setHasMore(result.length === PAGE_SIZE);
      setPage(nextPage);
    } catch {
      if (!append) setUsers([]);
      SnackBar.Error(t('users.messages.failedLoadUsers'));
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      setLoading(true);
      fetchUsers();
      return undefined;
    }, [fetchUsers, permissionState]),
  );

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchUsers(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && users.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('users.title')}</Text>
        <Button
          variant="ghost"
          onPress={() => router.push('/users/new' as Parameters<typeof router.push>[0])}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Plus} size={20} />
        </Button>
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('users.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : loading && users.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('users.loadingUsers')}</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>{t('users.noUsersFound')}</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>{t('users.addFirstUser')}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchUsers();
              }}
            />
          }
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) loadMore();
          }}
        >
          {users.map((user) => (
            <Pressable
              key={user.id}
              accessibilityRole="button"
              accessibilityLabel={t('users.accessibility.editUser', { name: user.displayName || user.userName || t('users.unnamedUser') })}
              onPress={() => router.push(`/users/edit?id=${encodeURIComponent(user.id)}` as Parameters<typeof router.push>[0])}
              style={[styles.userRow, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={[styles.avatar, { backgroundColor: theme.muted }]}>
                <Icon className="text-muted-foreground" as={UserRound} size={20} />
              </View>
              <View style={styles.userDetails}>
                <View style={styles.nameLine}>
                  <Text className="text-foreground" style={styles.userName} numberOfLines={1}>
                    {user.displayName || user.userName || t('users.unnamedUser')}
                  </Text>
                  <View style={[user.isActive === false ? styles.inactiveBadge : styles.activeBadge, { backgroundColor: theme.secondary }]}>
                    <Text
                      style={[
                        user.isActive === false ? styles.inactiveBadgeText : styles.activeBadgeText,
                        { color: user.isActive === false ? theme.destructive : theme.chart2 },
                      ]}
                    >
                      {t(user.isActive === false ? 'users.inactive' : 'users.active')}
                    </Text>
                  </View>
                </View>
                <Text className="text-muted-foreground" style={styles.userMeta} numberOfLines={1}>
                  {[user.userName, user.roleName].filter(Boolean).join(' · ') || t('users.noRoleAssigned')}
                </Text>
                <View style={styles.detailRow}>
                  <Icon className="text-muted-foreground" as={Mail} size={14} />
                  <Text className="text-muted-foreground" style={styles.detailText} numberOfLines={1}>
                    {user.email || '-'}
                  </Text>
                </View>
                {user.phone ? (
                  <View style={styles.detailRow}>
                    <Icon className="text-muted-foreground" as={Phone} size={14} />
                    <Text className="text-muted-foreground" style={styles.detailText} numberOfLines={1}>
                      {user.phone}
                    </Text>
                  </View>
                ) : null}
                {user.city || user.address ? (
                  <View style={styles.detailRow}>
                    <Icon className="text-muted-foreground" as={MapPin} size={14} />
                    <Text className="text-muted-foreground" style={styles.detailText} numberOfLines={1}>
                      {[user.city, user.address].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          ))}
          {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color={theme.primary} /> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButton: { minWidth: 44 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  content: { padding: 16, gap: 10 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: { flex: 1, gap: 4 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { flex: 1, fontSize: 15, fontWeight: '600' },
  userMeta: { fontSize: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { flex: 1, fontSize: 12 },
  activeBadge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  activeBadgeText: { fontSize: 11, fontWeight: '600' },
  inactiveBadge: { borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  inactiveBadgeText: { fontSize: 11, fontWeight: '600' },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
});