'use client';

import * as React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, ChevronDown, ChevronLeft, Save } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import LoadingOverlay from '@/components/loadingOverlay';
import UnauthorizedView from '@/components/unauthorized-view';
import SnackBar from '@/components/ui/snack-bar';
import { container, DI_TOKENS } from '@/di';
import { usePagePermission } from '@/lib/usePagePermission';
import { PermissionPage } from '@/models/rolePermission';
import { RoleItem } from '@/models/role';
import { IRoleService } from '@/services/roleService';
import { RolePermissionServiceClient } from '@/services/rolePermissionService';
import { THEME } from '@/lib/theme';

const roleService = container.resolve<IRoleService>(DI_TOKENS.IRoleService);
const permissionService = new RolePermissionServiceClient();

export default function RolePermissionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme() ?? { colorScheme: 'light' };
  const theme = colorScheme === 'dark' ? THEME.dark : THEME.light;
  const permissionState = usePagePermission('/rolepermissions');
  const [roles, setRoles] = React.useState<RoleItem[]>([]);
  const [pages, setPages] = React.useState<PermissionPage[]>([]);
  const [roleId, setRoleId] = React.useState('');
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [rolePickerVisible, setRolePickerVisible] = React.useState(false);

  const loadRolePermissions = React.useCallback(async (nextRoleId: string) => {
    setRoleId(nextRoleId);
    try {
      const keys = await permissionService.getRolePermissionKeys(nextRoleId);
      setSelectedKeys(new Set(keys));
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('rolePermissions.messages.failedLoadPermissions'));
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (permissionState !== 'authorized') return undefined;
      let active = true;
      setLoading(true);
      Promise.all([roleService.getRoles(1, 100), permissionService.getCatalog()])
        .then(async ([roleItems, catalog]) => {
          if (!active) return;
          setRoles(roleItems);
          setPages(catalog);
          const nextRoleId = roleId && roleItems.some((item) => item.id === roleId)
            ? roleId
            : roleItems[0]?.id ?? '';
          setRoleId(nextRoleId);
          if (nextRoleId) {
            const keys = await permissionService.getRolePermissionKeys(nextRoleId);
            if (active) setSelectedKeys(new Set(keys));
          } else {
            setSelectedKeys(new Set());
          }
        })
        .catch((error) => {
          if (active) SnackBar.Error(error instanceof Error ? error.message : t('rolePermissions.messages.failedLoad'));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }, [permissionState, roleId]),
  );

  const groups = React.useMemo(() => {
    const grouped = new Map<string, PermissionPage[]>();
    pages.forEach((page) => {
      const items = grouped.get(page.group) ?? [];
      items.push(page);
      grouped.set(page.group, items);
    });
    return [...grouped.entries()];
  }, [pages]);

  const toggleKey = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (keys: string[]) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      const selectAll = keys.some((key) => !next.has(key));
      keys.forEach((key) => selectAll ? next.add(key) : next.delete(key));
      return next;
    });
  };

  const save = async () => {
    if (!roleId) return;
    setSaving(true);
    try {
      await permissionService.updateRolePermissionKeys(roleId, [...selectedKeys]);
      SnackBar.Success(t('rolePermissions.messages.updated'));
    } catch (error) {
      SnackBar.Error(error instanceof Error ? error.message : t('rolePermissions.messages.failedSave'));
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((role) => role.id === roleId);

  return (
    <SafeAreaView className="flex-1 bg-background" style={styles.page}>
      <LoadingOverlay isLoading={saving} />
      <View className="bg-background border-b border-border" style={styles.headerBar}>
        <Button variant="ghost" onPress={() => router.back()} style={styles.headerButton}>
          <Icon className="text-foreground" as={ChevronLeft} size={22} />
        </Button>
        <Text className="text-foreground" style={styles.headerTitle}>{t('rolePermissions.title')}</Text>
        <Button
          variant="ghost"
          onPress={save}
          disabled={permissionState !== 'authorized' || !roleId || saving}
          style={styles.headerButton}
        >
          <Icon className="text-foreground" as={Save} size={19} />
        </Button>
      </View>

      {permissionState === 'checking' ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('rolePermissions.checkingPermission')}</Text>
        </View>
      ) : permissionState === 'denied' ? (
        <UnauthorizedView />
      ) : loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text className="text-muted-foreground" style={styles.stateText}>{t('rolePermissions.loadingPermissions')}</Text>
        </View>
      ) : roles.length === 0 ? (
        <View style={styles.centeredState}>
          <Text className="text-foreground" style={styles.emptyTitle}>{t('rolePermissions.emptyTitle')}</Text>
          <Text className="text-muted-foreground" style={styles.stateText}>{t('rolePermissions.emptyDescription')}</Text>
          <Button style={styles.createRoleButton} onPress={() => router.push('/roles/new' as Parameters<typeof router.push>[0])}>
            <Text className="font-semibold" style={{ color: theme.primaryForeground }}>{t('rolePermissions.createRole')}</Text>
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable style={[styles.roleSelect, { borderColor: theme.border }]} onPress={() => setRolePickerVisible(true)}>
            <View style={styles.roleSelectText}>
              <Text className="text-muted-foreground" style={styles.eyebrow}>{t('rolePermissions.roleLabel')}</Text>
              <Text className="text-foreground" style={styles.roleName}>{selectedRole?.role ?? t('rolePermissions.chooseRole')}</Text>
            </View>
            <Icon className="text-muted-foreground" as={ChevronDown} size={18} />
          </Pressable>

          {groups.map(([group, groupPages]) => {
            const allSelected = groupPages.every((page) => selectedKeys.has(page.key));
            return (
              <View key={group} style={styles.group}>
                <View style={[styles.groupHeader, { borderBottomColor: theme.border }]}>
                  <Text className="text-foreground" style={styles.groupTitle}>{group}</Text>
                  <Pressable accessibilityRole="button" onPress={() => toggleGroup(groupPages.map((page) => page.key))}>
                    <Text style={[styles.groupAction, { color: theme.primary }]}>{t(allSelected ? 'rolePermissions.clearGroup' : 'rolePermissions.selectGroup')}</Text>
                  </Pressable>
                </View>
                {groupPages.map((page) => {
                  const checked = selectedKeys.has(page.key);
                  return (
                    <Pressable
                      key={page.key}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      onPress={() => toggleKey(page.key)}
                      style={[styles.permissionRow, { borderBottomColor: theme.border }]}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: theme.border },
                          checked ? { backgroundColor: theme.primary, borderColor: theme.primary } : null,
                        ]}
                      >
                        {checked ? <Check size={14} color={theme.primaryForeground} /> : null}
                      </View>
                      <View style={styles.permissionInfo}>
                        <Text className="text-foreground" style={styles.permissionTitle}>{page.title}</Text>
                        <Text className="text-muted-foreground" style={styles.permissionPath}>{page.key}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      )}

      <Modal transparent visible={rolePickerVisible} animationType="slide" onRequestClose={() => setRolePickerVisible(false)}>
        <View style={[styles.modalBackdrop, { backgroundColor: theme.overlay }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRolePickerVisible(false)} />
          <View style={[styles.rolePicker, { backgroundColor: theme.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <Text className="text-foreground" style={styles.pickerTitle}>{t('rolePermissions.selectRole')}</Text>
            <ScrollView>
              {roles.map((role) => (
                <Pressable
                  key={role.id}
                  style={[styles.roleOption, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setRolePickerVisible(false);
                    void loadRolePermissions(role.id);
                  }}
                >
                  <Text className="text-foreground">{role.role}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6 },
  headerButton: { minWidth: 42 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  roleSelect: { minHeight: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, borderWidth: 1, borderRadius: 6 },
  roleSelectText: { gap: 3 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  roleName: { fontSize: 15, fontWeight: '700' },
  group: { gap: 0 },
  groupHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  groupTitle: { fontSize: 14, fontWeight: '800' },
  groupAction: { fontSize: 12, fontWeight: '700' },
  permissionRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 4 },
  permissionInfo: { flex: 1, gap: 2 },
  permissionTitle: { fontSize: 13, fontWeight: '600' },
  permissionPath: { fontSize: 10 },
  centeredState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { marginTop: 8, textAlign: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  createRoleButton: { marginTop: 16 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  rolePicker: { maxHeight: '70%', padding: 20, paddingBottom: 28, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  pickerTitle: { marginBottom: 10, fontSize: 16, fontWeight: '700' },
  roleOption: { minHeight: 44, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
});