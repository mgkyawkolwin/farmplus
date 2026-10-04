'use client';

import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Mail, MapPin, Pencil, Plus, Trash2, UserRound } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import User from '@/models/user';
import { IUserService } from '@/services/userService';
import LoadingOverlay from '@/components/loadingOverlay';

const userService = container.resolve<IUserService>(DI_TOKENS.IUserService);
const PAGE_SIZE = 20;

export default function UserListScreen() {
  const router = useRouter();
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
      SnackBar.Error('Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchUsers();
      return undefined;
    }, [fetchUsers]),
  );

  const deleteUser = (user: User) => {
    Alert.alert('Delete user', `Delete ${user.displayName || user.userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await userService.deleteUser(user.id);
            setUsers((current) => current.filter((item) => item.id !== user.id));
            SnackBar.Success('User deleted successfully');
          } catch {
            SnackBar.Error('Failed to delete user');
          }
        },
      },
    ]);
  };

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
        <Text className="text-foreground" style={styles.headerTitle}>Users</Text>
        <Button
          variant="ghost"
          onPress={() => router.push('/users/new' as Parameters<typeof router.push>[0])}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Plus} size={20} />
        </Button>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading users...</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>No users found</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>Add a user to get started.</Text>
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
            <View key={user.id} style={styles.userRow}>
              <View style={styles.avatar}>
                <Icon className="text-muted-foreground" as={UserRound} size={20} />
              </View>
              <View style={styles.userDetails}>
                <Text className="text-foreground" style={styles.userName} numberOfLines={1}>
                  {user.displayName || user.userName || 'Unnamed user'}
                </Text>
                <View style={styles.detailRow}>
                  <Icon className="text-muted-foreground" as={Mail} size={14} />
                  <Text className="text-muted-foreground" style={styles.detailText} numberOfLines={1}>
                    {user.email || '-'}
                  </Text>
                </View>
                {user.city || user.address ? (
                  <View style={styles.detailRow}>
                    <Icon className="text-muted-foreground" as={MapPin} size={14} />
                    <Text className="text-muted-foreground" style={styles.detailText} numberOfLines={1}>
                      {[user.city, user.address].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${user.displayName || user.userName}`}
                onPress={() => router.push(`/users/edit?id=${encodeURIComponent(user.id)}` as Parameters<typeof router.push>[0])}
                style={styles.iconButton}
              >
                <Icon className="text-foreground" as={Pencil} size={18} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${user.displayName || user.userName}`}
                onPress={() => deleteUser(user)}
                style={styles.iconButton}
              >
                <Icon className="text-destructive" as={Trash2} size={18} />
              </Pressable>
            </View>
          ))}
          {loadingMore ? <ActivityIndicator style={styles.loadMore} size="small" color="#2563EB" /> : null}
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
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  userDetails: { flex: 1, gap: 4 },
  userName: { fontSize: 15, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { flex: 1, fontSize: 12 },
  iconButton: { padding: 7 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
});