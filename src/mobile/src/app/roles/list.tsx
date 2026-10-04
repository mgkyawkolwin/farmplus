'use client';

import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import SnackBar from '@/components/ui/snack-bar';
import LoadingOverlay from '@/components/loadingOverlay';
import { container, DI_TOKENS } from '@/di';
import { RoleItem } from '@/models/role';
import { IRoleService } from '@/services/roleService';

const roleService = container.resolve<IRoleService>(DI_TOKENS.IRoleService);
const PAGE_SIZE = 20;

export default function RoleListScreen() {
  const router = useRouter();
  const [roles, setRoles] = React.useState<RoleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const fetchRoles = React.useCallback(async (nextPage = 1, append = false) => {
    try {
      const result = await roleService.getRoles(nextPage, PAGE_SIZE);
      setRoles((current) => append ? [...current, ...result] : result);
      setHasMore(result.length === PAGE_SIZE);
      setPage(nextPage);
    } catch {
      if (!append) setRoles([]);
      SnackBar.Error('Failed to load roles');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetchRoles();
      return undefined;
    }, [fetchRoles]),
  );

  const deleteRole = (role: RoleItem) => {
    Alert.alert('Delete role', `Delete ${role.role}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await roleService.deleteRole(role.id);
            setRoles((current) => current.filter((item) => item.id !== role.id));
            SnackBar.Success('Role deleted successfully');
          } catch {
            SnackBar.Error('Failed to delete role');
          }
        },
      },
    ]);
  };

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchRoles(page + 1, true);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={loading && roles.length > 0} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>Roles</Text>
        <Button
          variant="ghost"
          onPress={() => router.push('/roles/new' as Parameters<typeof router.push>[0])}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Plus} size={20} />
        </Button>
      </View>

      {loading && roles.length === 0 ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-muted-foreground" style={styles.stateText}>Loading roles...</Text>
        </View>
      ) : roles.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.stateTitle}>No roles found</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>Add a role to get started.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchRoles();
              }}
            />
          }
          onMomentumScrollEnd={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) loadMore();
          }}
        >
          {roles.map((role) => (
            <View key={role.id} style={styles.roleRow}>
              <View style={styles.roleIcon}>
                <Icon className="text-muted-foreground" as={ShieldCheck} size={20} />
              </View>
              <Text className="text-foreground" style={styles.roleName} numberOfLines={1}>{role.role}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Edit ${role.role}`}
                onPress={() => router.push(`/roles/edit?id=${encodeURIComponent(role.id)}` as Parameters<typeof router.push>[0])}
                style={styles.iconButton}
              >
                <Icon className="text-foreground" as={Pencil} size={18} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete ${role.role}`}
                onPress={() => deleteRole(role)}
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
  roleRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
  },
  roleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  roleName: { flex: 1, fontSize: 15, fontWeight: '600' },
  iconButton: { padding: 7 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontSize: 17, fontWeight: '600' },
  stateText: { marginTop: 8, textAlign: 'center' },
  loadMore: { marginVertical: 12 },
});